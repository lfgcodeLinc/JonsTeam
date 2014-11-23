__author__ = 'David'

from App import pgdb

database = pgdb.PGDatabase()


# print(database.status)
database.addItem("JonsPencil", "A long yellow pencil.", 10)

database.query("SELECT * FROM items;")
database.commitChanges()

print(database.fetchAllResults())