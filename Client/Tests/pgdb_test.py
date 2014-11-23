__author__ = 'David'

from App import pgdb

database = pgdb.PGDatabase()


# print(database.status)
# database.addItemToCatalog("JonsPencil", "A long yellow pencil.", 10)

# database.query("SELECT column_name "
#                "FROM information_schema.columns "
#                "WHERE table_name = 'orders';")

def test_joins():
    results = database.cursor.execute("SELECT (inventory.id, inventory.item_id, inventory.quantity, items.name) FROM inventory JOIN items ON inventory.item_id = items.id")
    print database.fetchAllResults()

def test_removeItem():
    results = database.removeItem()


def test_hasRecord():
    results = database.hasRecord("inventory", "item_id", 18)
    if results[0]:
        print("Yes")

def test_filterByUser():
    results = database.filterOrdersByUser(2)
    print results


if __name__ == '__main__':
    try:
        test_filterByUser()
    except Exception, e:
        print e
