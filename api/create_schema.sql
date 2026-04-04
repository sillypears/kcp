-- Database: keyc

-- DROP DATABASE IF EXISTS keyc;

CREATE DATABASE keyc
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    LOCALE_PROVIDER = 'libc'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

-- Table: public.boxes

-- DROP TABLE IF EXISTS public.boxes;

CREATE TABLE IF NOT EXISTS public.boxes
(
    id integer NOT NULL DEFAULT nextval('boxes_id_seq'::regclass),
    label character varying(50) COLLATE pg_catalog."default" NOT NULL,
    name character varying(255) COLLATE pg_catalog."default",
    maker_name character varying(255) COLLATE pg_catalog."default",
    capacity integer,
    height integer DEFAULT 9,
    width integer DEFAULT 9,
    dedicated boolean DEFAULT false,
    allow_add boolean DEFAULT true,
    allow_duplicates boolean DEFAULT false,
    CONSTRAINT boxes_pkey PRIMARY KEY (id),
    CONSTRAINT boxes_label_key UNIQUE (label)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.boxes
    OWNER to postgres;

-- Table: public.makers

-- DROP TABLE IF EXISTS public.makers;

CREATE TABLE IF NOT EXISTS public.makers
(
    id integer NOT NULL DEFAULT nextval('makers_id_seq'::regclass),
    maker_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    maker_name_clean character varying(255) COLLATE pg_catalog."default",
    instagram character varying(255) COLLATE pg_catalog."default",
    city character varying(100) COLLATE pg_catalog."default",
    state character varying(50) COLLATE pg_catalog."default",
    country character varying(10) COLLATE pg_catalog."default",
    first_name character varying(50) COLLATE pg_catalog."default",
    state_code character varying(3) COLLATE pg_catalog."default",
    CONSTRAINT makers_pkey PRIMARY KEY (id),
    CONSTRAINT makers_maker_name_key UNIQUE (maker_name)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.makers
    OWNER to postgres;

-- Table: public.keycaps

-- DROP TABLE IF EXISTS public.keycaps;

CREATE TABLE IF NOT EXISTS public.keycaps
(
    id integer NOT NULL DEFAULT nextval('keycaps_id_seq'::regclass),
    maker_id integer,
    collab_id integer,
    box_id integer,
    cell_x integer,
    cell_y integer,
    sculpt character varying(255) COLLATE pg_catalog."default",
    sculpt_clean character varying(255) COLLATE pg_catalog."default",
    colorway character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT keycaps_pkey PRIMARY KEY (id),
    CONSTRAINT keycaps_maker_id_sculpt_colorway_key UNIQUE (maker_id, sculpt, colorway),
    CONSTRAINT keycaps_box_id_fkey FOREIGN KEY (box_id)
        REFERENCES public.boxes (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT keycaps_maker_id_fkey FOREIGN KEY (maker_id)
        REFERENCES public.makers (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT keycaps_collab_id_fkey FOREIGN KEY (collab_id)
        REFERENCES public.makers (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.keycaps
    OWNER to postgres;

CREATE OR REPLACE VIEW all_keycaps AS
SELECT 
    k.id AS id,
    k.maker_id AS maker_id,
    m.maker_name AS maker_name,
    k.collab_id AS collab_id,
    c.maker_name AS collab_name,
    k.sculpt AS sculpt,
    CONCAT(m.maker_name_clean, REPLACE(k.sculpt, ' ', '_')) AS unique_id,
    k.colorway AS colorway,
    k.box_id AS box_id,
    b.label AS "label",
    k.cell_x AS cell_x,
    k.cell_y AS cell_y
FROM keycaps k
LEFT JOIN makers m ON m.id = k.maker_id
LEFT JOIN makers c on c.id = k.collab_id
LEFT JOIN boxes b ON b.id = k.box_id;