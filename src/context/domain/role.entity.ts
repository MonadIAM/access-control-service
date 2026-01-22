import { Entity, PrimaryKey, Property, Unique } from "@mikro-orm/postgresql";

@Entity({ tableName: "role", schema: "access_control" })
@Unique({ name: "role_code_unique", properties: ["code"] })
export class Role {
    @PrimaryKey({ type: "uuid", defaultRaw: "gen_random_uuid()" })
    public id!: string;

    @Property({ length: 128 })
    public code!: string;

    @Property({ length: 255 })
    public name!: string;

    @Property({ columnType: "text", nullable: true })
    public description?: string;
}
