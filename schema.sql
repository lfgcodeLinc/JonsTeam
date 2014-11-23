create table schools (
  id serial primary key,
  name text,
  address text
);

create table users (
  id serial primary key,
  name text,
  pass text,
  email text unique,
  phone text,
  balance float4,
  teacher boolean,
  school_id int references schools(id)
);

create table volunteers (
  id serial primary key,
  user_id int references users(id),
  availability text
);

create table items (
  id serial primary key,
  name text,
  description text,
  price float4
);

create table inventory (
  id serial primary key,
  item_id int references items(id),
  quantity int
);

create table deliveries (
  id serial primary key,
  location text
);

create table orders (
  id serial primary key,
  user_id int references users(id),
  created timestamp default now(),
  completed boolean,
  delivery_id int references deliveries(id),
  pickup timestamp
);

create table order_items (
  id serial primary key,
  order_id int references orders(id),
  item_id int references items(id)
);
