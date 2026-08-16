CREATE ROLE access_control_service_readonly NOLOGIN;

GRANT CONNECT ON DATABASE "access-control-service" TO access_control_service_readonly;
GRANT USAGE ON SCHEMA public TO access_control_service_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO access_control_service_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO access_control_service_readonly;
