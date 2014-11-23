__author__ = 'David'


import psycopg2

class PGDatabase(object):
    def __init__(self):
        # Connect to a database
        url = "postgres://vqesjlxdyoxqvq:HR5OD_Svzd48Nwzu6FN4-VTZd6@ec2-54-243-245-159.compute-1.amazonaws.com:5432/dabosh8r2vtap1"
        self.connection = psycopg2.connect(url)

        # Open a cursor to perform database operations
        self.cursor = self.connection.cursor()

    def __del__(self):
        # Close communications with database
        self.cursor.close()
        self.connection.close()

    def hasRecord(self, table, column, value):
        cmd = "SELECT count(*) FROM {0} where {1}={2}".format(table, column, value)
        self.cursor.execute(cmd)
        return self.fetchAllResults()

    def addItemToCatalog(self, name, desc, price):
        self.cursor.execute("INSERT INTO items (name, description, price) VALUES (%s, %s, %s)",
            (name, desc, price))

    def addItemToInventory(self, item, quantity):
        self.cursor.execute("INSERT INTO inventory (item_id, quantity) VALUES (%s, %s)",
            (item, quantity))

    def addSchool(self, name, address):
        self.cursor.execute("INSERT INTO schools (name, address) VALUES (%s, %s)",
            (name, address))

    def commitChanges(self):
        self.connection.commit()

    def rollbackChanges(self):
        self.connection.rollback()

    def removeItem(self, table, id):
        cmd = "DELETE FROM {0} WHERE id={1};".format(table, id)
        try:
            self.cursor.execute(cmd)
        except Exception, e:
            print e

    def updateRecord(self, table, ID, field, value):
        # self.cursor.execute("SELECT data_type FROM information_schema.columns WHERE table_name = '{0}';".format(table))

        if type(value) is str:
            if value.isalpha():
                value = "'{0}'".format(value)
        cmd = "UPDATE {0} SET {1}={2} WHERE id={3}".format(table, field, value, ID)
        self.cursor.execute(cmd)

    def fetchOneResult(self):
        return self.cursor.fetchone()

    def fetchAllResults(self):
        return self.cursor.fetchall()

    def getColumnHeaders(self, tableName):
        self.cursor.execute("""SELECT column_name
               FROM information_schema.columns
               WHERE table_name = (%s);""", [tableName])
        return self.fetchAllResults()

    def getInventoryWithNames(self):
        self.cursor.execute("""
            SELECT inventory.id, inventory.item_id, inventory.quantity, items.name
            FROM inventory JOIN items ON inventory.item_id = items.id""")
        return self.fetchAllResults()

    def filterOrdersByUser(self, user):
        self.cursor.execute("SELECT * FROM orders WHERE user_id = %s", (user,))
        return self.fetchAllResults()

    def filterOrdersBySchool(self, school):
        self.cursor.execute("SELECT * FROM users WHERE school_id = %s", (school,))
        return self.fetchAllResults()

    def filterOrdersByCompleted(self):
        self.cursor.execute("SELECT * FROM orders WHERE completed = %s", (False,))
        return self.fetchAllResults()

    def getAllRows(self, tableName):
        self.cursor.execute("SELECT * FROM {0};".format(tableName))
        return self.fetchAllResults()

