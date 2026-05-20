# Design Notes

**Disclaimer:**

1. This file is not intended to be exhaustive project documentation. Its purpose is to capture my architectural decisions, trade-offs, and reasoning while designing this service.
2. The decisions described here reflect the context and constraints of a specific pet project. Some of them may be suboptimal, debatable, or simply wrong, so this repository should not be treated as a universal guidebook for other projects.
3. If you have questions, comments, or want to point out a mistake, feel free to contact me through any available channel. Contact information is listed in my GitHub profile.

----

<details>
<summary><strong>Architecture</strong></summary>

#### Architectural Style

The architecture is inspired by the layered approach of DDD, the principles of Clean Architecture, and the ideas of Hexagonal Architecture: unidirectional dependency flow, dependency inversion, separation of domain logic from transport and infrastructure details, and representing external ways of interacting with the system as adapters around the application/domain core. HTTP controllers, gRPC controllers, Kafka consumers, persistence, Redis projection cache, and other infrastructure live at the edges of the system, while commands/queries act as the boundary of the use-case layer.

At the same time, I do not treat these approaches as dogma. The project intentionally remains pragmatic: NestJS and MikroORM are the chosen platform for the foreseeable future, so in some places I allow small, controlled dependencies on them even in the domain layer, as long as this simplifies the model and does not prevent the system from evolving.

#### Domain Model

The domain layer uses a rich domain model instead of an anemic one. Entities encapsulate part of the business invariants and operations over their own state, which simplifies working with the Unit of Work and helps reduce the number of round trips to PostgreSQL.

#### CQRS-Inspired Read/Write Separation

The system does not implement CQRS in its canonical form, but it uses several related read/write separation ideas.

First, read and write operations are separated at the application API level and go through different pipelines: queries are responsible for the read path, while commands are responsible for the write path. This separation is preserved across layers and is tied not only to code organization, but also to the storage infrastructure.

Second, PostgreSQL uses a primary/read-replica split. Write operations go to the primary instance, while the read path can use the read replica. This is not CQRS by itself, but it complements the command/query pipeline separation at the infrastructure level.

Third, the most frequent hot read path uses a Redis-based projection, which can be viewed as materialized state over PostgreSQL models. This projection is synchronized with PostgreSQL through Kafka and CDC Debezium. Structurally, it corresponds to the main PostgreSQL models, but intentionally omits metadata that is not needed for fast access checks. Redis also stores several classes of indexes: structural, effective, and full. They are used to optimize different types of operations, because in this part of the system read speed is more important than storage volume.

#### Event-Driven Integration

For inter-service integration, the service contains elements of event-driven architecture. Domain changes are not published directly to Kafka from application code; instead, outbox events and projection journal records are written within the same PostgreSQL transaction. They are then picked up through CDC/Debezium and passed to Kafka, where they are processed by external consumers. This approach reduces the risk of inconsistency between database state changes and event publication, while keeping the service boundary clear enough: the service records the state change and integration events, while delivery and processing happen asynchronously.

To improve the resilience of asynchronous processing, the project uses separate DLQs for most Kafka topics. Messages that could not be handled by the normal consumer are sent to the corresponding dead-letter topic, after which BullMQ schedules an automatic attempt to return the message to the original topic. The retry mechanism uses exponential delays with jitter to reduce the risk of synchronized retry spikes and give dependent services time to recover.

#### Transaction Orchestration

A custom transaction manager is used to localize transactional orchestration. At the moment, it is an imperfect but intentional implementation of a centralized orchestration class that connects the main business operation with the system side effects described above: audit log, change log, outbox, and projection journal. At this stage, this is an intentional compromise: I understand the risk of creating a god class, but for now this approach gives me a single place to control transactional effects and fits the current shape of the system better than premature decomposition.

#### Local Implementation Patterns

At the interface/context level, the project also uses implementation patterns such as mixin and adapter. Mixin helps solve behavior reuse by allowing the inheritance model to be organized in an "hourglass" shape, while adapter is used to separate MikroORM and Knex infrastructure mappers from the operational logic of repositories.

#### Database Model

At the database structure level, the key pattern is closure table. It was chosen to model the role hierarchy because the system needs fast read paths without constantly complicating runtime queries with recursive CTEs. This is especially important because some SQL queries in the system are already complex due to the number of implemented models such as HRBAC and DAC.

</details>

----

<details>
<summary><strong>Type System Methodology</strong></summary>

#### General Idea

The typing methodology in this project is built around the idea that the type layer is a separate compile-time architecture of the system. This is not pointwise typing "where TypeScript forced it", but an intentional attempt to describe most of the system through contracts: operation inputs and outputs, public surfaces of classes, DI boundaries, commands, queries, repositories, consumers, services, adapters, and transaction effects.

Types in TypeScript are compile-time entities. They do not participate in runtime, do not end up in the final JavaScript, and should not be treated as full runtime modules of the application. For this reason, contracts and helper types in the project are mostly moved into declaration files `.d.ts`, separately from implementation files.

This approach keeps implementation code focused on behavior, while the type layer acts as a strict map of the system: which operations exist, what data they accept, what they return, and which surfaces are available to different consumers.

The project aims for near-complete typing and avoids `any`. Exceptions are allowed only in places where they are technically justified by TypeScript limitations or used as part of an explicitly isolated utility-level mechanism, for example in the base utility type for mixin constructors, where this is related to TypeScript limitations and the TS2545 rule.

#### Declaration Files and Ambient Namespaces

The project actively uses ambient namespaces and declaration merging. Namespaces with the same name can be extended by multiple declaration files, forming a shared type context without the need to import every contract manually.

This decision was not made to avoid writing imports as such, but because of the scale of the contract layer. The project has many cross-cutting types used at different levels: commands, queries, repositories, DTO-like structures, events, adapters, entities, and transaction effects. At this scale, import type in every implementation file quickly turns into noise and starts to represent the actual structure of the system less clearly.

Namespace merging is used with discipline: one namespace may be split across multiple files, but those files must be located next to each other in the expected directory. This keeps type placement predictable. For example, repository contracts are located in domain/repositories, command contracts in interface/commands, and query contracts in interface/queries.

At the same time, `.d.ts` files may import external types when a contract truly depends on a specific technical type, such as EntityManager, FilterQuery, FindOptions, or EntityKey from MikroORM. In such cases, the file becomes a module declaration file and uses declare global to extend the shared namespace.

Thus, ambient namespaces are not used as a global dump for types, but as a way to build a separate compile-time contract space with understandable structure and navigation.

#### Parallel Type Pipeline

The type layer mirrors the structure of the application's runtime layers. For most key elements, there is a symmetry between `.d.ts` contracts and `.ts` implementations.

**For example:**
- `src/context/interface/commands/*.d.ts` - describes contracts for the commands.
- `src/context/application/commands/*.ts` - contains implementations of commands contracts.
- `src/context/domain/repositories/*.d.ts` - describes repository contracts.
- `src/context/infrastructure/repositories/*.ts` - contains repository implementations.

This forms a parallel pipeline of types and implementations. The runtime pipeline describes the behavior of the system, while the type pipeline fixes the allowed relationships, contracts, and interaction surfaces between layers.

#### Namespace Structure

Inside `.d.ts` files, namespaces are split quite deeply. The structure usually follows this principle: `Context -> Entity/Component -> Contract/Operation -> Props/Result`

**For example:**
- Repositories.Role
- Repositories.Role.Contract
- Repositories.Role.FindAncestors.Props
- Repositories.Role.FindAncestors.Result
- Repositories.Role.GetHierarchyGraph.Props
- Repositories.Role.GetHierarchyGraph.Result

This style makes signatures uniform and predictable. A contract method usually accepts Operation.Props and returns Operation.Result. This is especially important when there are many operations, because it reduces type chaos and makes the contract surface of a layer visually consistent.

#### Contract Surfaces and DI Boundaries

The main unit of behavior typing is a contract. A contract describes the surface of a class or component, but it does not have to match what will actually be available to each consumer through DI.

A single implementation class can implement a common Contract that includes several surfaces:
- ControllerContract - methods available to HTTP/gRPC controllers.
- ConsumerContract - methods available to Kafka consumers.
- QueryContract - a slice of the repository contract available to read-side layers.
- PrivateContract - internal implementation methods that are useful to type, but should not be exposed outward through DI.

The final Contract can extend all these surfaces, while a specific DI token exposes only the required slice outward. This is an application of the Dependency Inversion Principle and Interface Segregation Principle at the type level: a layer depends on a contract surface rather than on a concrete class, and each consumer sees only the part of the API it needs.

PrivateContract in this model is not real privacy at the compiler level. Since the namespace is globally available, any code can theoretically reference the private surface. Privacy here is held not by access modifiers, but by composition and DI discipline: no token exposing the private surface is exported outward. This is an intentional compromise that allows internal methods to be typed while preserving a single implementation contract.

</details>

----
