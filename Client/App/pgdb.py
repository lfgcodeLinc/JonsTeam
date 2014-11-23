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

    def addItem(self, name, desc, price):
        self.cursor.execute("INSERT INTO items (name, description, price) VALUES (%s, %s, %s)",
            (name, desc, price))

    def commitChanges(self):
        self.connection.commit()

    def removeItem(self):
        pass

    def query(self, queryString):
        cur = self.cursor
        cur.execute(queryString)

    def fetchOneResult(self):
        return self.cursor.fetchone()

    def fetchAllResults(self):
        return self.cursor.fetchall()