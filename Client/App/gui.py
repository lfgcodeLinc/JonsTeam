__author__ = 'David'

import sys
from PyQt4 import QtGui, QtCore, uic
from pgdb import PGDatabase

form_class = uic.loadUiType("App/mainUI.ui")[0]

class GUI(QtGui.QMainWindow, form_class):
    def __init__(self, parent=None):
        QtGui.QMainWindow.__init__(self, parent)
        self.setupUi(self)

        self.database = PGDatabase()

        self.inventoryClicked = 0
        self.catalogClicked = 0
        self.buildAllTableViews()
        self.buildInventoryTableView()

        self.commitChangesButton.clicked.connect(self.database.commitChanges)
        self.commitChangesButton.clicked.connect(self.buildAllTableViews)

        self.rollbackChangesButton.clicked.connect(self.database.rollbackChanges)
        self.rollbackChangesButton.clicked.connect(self.buildAllTableViews)

        # Schools buttons
        self.schoolAddButton.clicked.connect(self.createSchoolAddDialog)
        self.removeSchoolButton.clicked.connect(
            lambda: self.removeTableEntry(self.schoolsTable, "schools")
        )

        # Catalog table buttons
        self.addToCatalogButton.clicked.connect(self.createCatalogAddDialog)
        self.removeFromCatalogButton.clicked.connect(
            lambda: self.removeTableEntry(self.catalogTable, "items"))

        # Inventory table button
        self.addInventoryButton.clicked.connect(self.createInventoryAddDialog)
        self.removeInventoryButton.clicked.connect(
            lambda: self.removeTableEntry(self.inventoryTable, "inventory")
        )

        # Orders table
        self.filterByUserButton.clicked.connect(self.queryByPrompt)
        self.filterByCompletedButton.clicked.connect(self.buildOrdersByCompleted)
        self.restoreOrdersButton.clicked.connect(
            lambda: self.buildTableView(self.orderTable, "orders")
        )

        # User table buttons
        # self.addUsersButton.clicked.connect(self.createUserAddDialog)
        self.removeUserButton.clicked.connect(
            lambda: self.removeTableEntry(self.usersTable, "users")
        )
        # self.modifyInventoryButton.clicked.connect()
        # self.removeInventoryButton.clicked.connect()


    def initUI(self):
        self.setGeometry(300, 300, 250, 150)
        self.setWindowTitle('GEA Admin')
        self.show()

    def testFunc(self):
        print("Yes")

    def removeTableEntry(self, tableWidget, dbTableName):
        selectedItems = tableWidget.selectedItems()
        if selectedItems:
            rows = []
            for item in selectedItems:
                rows.append(tableWidget.row(item))
            rows = set(rows)
        for row in rows:
            toDelete = tableWidget.item(row, 0)
            toDelete = int(toDelete.text())
            self.database.removeItem(dbTableName, toDelete)
        self.buildTableView(tableWidget, dbTableName)

    def removeCatalogEntry(self):
        selectedItems = self.catalogTable.selectedItems()
        if selectedItems:
            rows = []
            for item in selectedItems:
                rows.append(self.catalogTable.row(item))
            rows = set(rows)
        for row in rows:
            toDelete = self.catalogTable.item(row, 0)
            toDelete = int(toDelete.text())
            self.database.removeItem("items", toDelete)
        self.buildTableView(self.catalogTable, "items")

    def modifyInventoryEntry(self, row, col):
        if self.inventoryClicked:
            self.inventoryClicked = 0
            header = str(self.inventoryTable.horizontalHeaderItem(col).text())
            toModifyID = str(self.inventoryTable.item(row, 0).text())
            newValue = str(self.inventoryTable.item(row, col).text())
            self.database.updateRecord("inventory", toModifyID, header, newValue)
            self.buildInventoryTableView()

    def modifyCatalogEntry(self, row, col):
        if self.catalogClicked:
            self.catalogClicked = 0
            header = str(self.catalogTable.horizontalHeaderItem(col).text())
            toModifyID = str(self.catalogTable.item(row, 0).text())
            newValue = str(self.catalogTable.item(row, col).text())
            self.database.updateRecord("items", toModifyID, header, newValue)
            self.buildTableView(self.catalogTable, "items")


    def buildAllTableViews(self):
        self.buildTableView(self.catalogTable, "items")
        self.buildTableView(self.inventoryTable, "inventory")
        self.buildTableView(self.orderTable, "orders")
        self.buildTableView(self.usersTable, "users")
        self.buildTableView(self.schoolsTable, "schools")

    def buildTableView(self, tableWidget, dbTableName):
        tableWidget.clear()
        # Get the headers and set them in the table
        headers = self.database.getColumnHeaders(dbTableName)
        tableWidget.setColumnCount(len(headers))
        headerLabels = QtCore.QStringList()
        for i, header in enumerate(headers):
            headerLabels.append(header[0])
        tableWidget.setHorizontalHeaderLabels(headerLabels)

        # Populate the table
        results = self.database.getAllRows(dbTableName)
        tableWidget.setRowCount(len(results))
        for i, row in enumerate(results):
            for j, item in enumerate(row):
                # self.inventoryTable.setItem(i, j, QtGui.QTableWidgetItem(item))
                tableItem = QtGui.QTableWidgetItem(str(item))
                tableWidget.setItem(i, j, tableItem)
        if dbTableName is "inventory":
            def inventoryClicked():
                self.inventoryClicked = 1
            tableWidget.cellDoubleClicked.connect(inventoryClicked)
            tableWidget.cellChanged.connect(self.modifyInventoryEntry)
        if dbTableName is "items":
            def catalogClicked():
                self.catalogClicked = 1
            tableWidget.cellDoubleClicked.connect(catalogClicked)
            tableWidget.cellChanged.connect(self.modifyCatalogEntry)


    def buildInventoryTableView(self):
        # Get the headers and set them in the table
        headers = self.database.getColumnHeaders("inventory")
        self.inventoryTable.setColumnCount(len(headers)+1)
        headerLabels = QtCore.QStringList()
        for i, header in enumerate(headers):
            headerLabels.append(header[0])
        headerLabels.append('name')
        self.inventoryTable.setHorizontalHeaderLabels(headerLabels)

        # Populate the table
        results = self.database.getInventoryWithNames()
        self.inventoryTable.setRowCount(len(results))
        for i, row in enumerate(results):
            for j, item in enumerate(row):
                # self.inventoryTable.setItem(i, j, QtGui.Qself.inventoryTableItem(item))
                tableItem = QtGui.QTableWidgetItem(str(item))
                self.inventoryTable.setItem(i, j, tableItem)
        def inventoryClicked():
            self.inventoryClicked = 1
        def inventoryDoubleClicked(row, col):
            print row, col
        self.inventoryTable.cellDoubleClicked.connect(inventoryClicked)
        self.inventoryTable.cellChanged.connect(self.modifyInventoryEntry)
        self.inventoryTable.cellDoubleClicked.connect(inventoryDoubleClicked)

    def buildOrdersByUser(self):
        text, ok = QtGui.QInputDialog.getText(self, 'Input Dialog',
            'User id?:')
        if ok:
            # REPopulate the table
            results = self.database.filterOrdersByUser(int(text))
            self.usersTable.setRowCount(len(results))
            for i, row in enumerate(results):
                for j, item in enumerate(row):
                    # self.inventoryTable.setItem(i, j, QtGui.Qself.inventoryTableItem(item))
                    tableItem = QtGui.QTableWidgetItem(str(item))
                    self.usersTable.setItem(i, j, tableItem)

    def buildOrdersByCompleted(self):
        # REPopulate the table
            results = self.database.filterOrdersByCompleted()
            self.displayQueryResponse(self.orderTable, results)

    def testDC(self, row, col):
        print row, col

    def createCatalogAddDialog(self):
        dialog = CatalogAddDialog()
        if dialog.exec_() == QtGui.QDialog.Accepted:
            itemName, itemDesc, itemPrice = dialog.getTextFields()
            self.database.addItemToCatalog(itemName, itemDesc, itemPrice)
        self.buildTableView(self.catalogTable, "items")

    def createInventoryModifyDialog(self):
        dialog = InventoryModifyDialog()
        if dialog.exec_() == QtGui.QDialog.Accepted:
            itemName, itemDesc, itemPrice = dialog.getTextFields()
            self.database.addItemToCatalog(itemName, itemDesc, itemPrice)
        self.buildInveTableView(self.catalogTable, "items")

    def createInventoryAddDialog(self):
        dialog = InventoryAddDialog()
        if dialog.exec_() == QtGui.QDialog.Accepted:
            item, quant = dialog.getTextFields()
            self.database.addItemToInventory(item, quant)
        self.buildInventoryTableView()

    def createSchoolAddDialog(self):
        dialog = SchoolAddDialog()
        if dialog.exec_() == QtGui.QDialog.Accepted:
            name, address = dialog.getTextFields()
            self.database.addSchool(name, address)
        self.buildTableView(self.schoolsTable, "schools")

    def displayQueryResponse(self, tableWidget, response):
        if not response: return
        # tableWidget = QtGui.QTableWidget()
        oldRows = tableWidget.rowCount()
        for i in range(oldRows):
            tableWidget.removeRow(i)
        tableWidget.setRowCount(len(response))
        tableWidget.setColumnCount(len(response[0]))
        for i, row in enumerate(response):
            for j, item in enumerate(row):
                tableWidget.setItem(i, j, QtGui.QTableWidgetItem(str(item)))

    def queryByPrompt(self):
        text, ok = QtGui.QInputDialog.getText(self, 'Input Dialog',
            'User id?:')
        if ok:
            # REPopulate the table
            results = self.database.filterOrdersByUser(int(text))
            self.displayQueryResponse(self.orderTable, results)

class CatalogAddDialog(QtGui.QDialog, uic.loadUiType("App/catalog_add.ui")[0]):
    def __init__(self, parent=None):
        QtGui.QDialog.__init__(self, parent)
        self.setupUi(self)
        self.catalogDialogAccept.clicked.connect(self.handleInput)
        self.show()

    def handleInput(self):
        self.itemName = self.itemNameInput.text()
        self.itemDesc = self.itemDescInput.text()
        self.itemPrice = self.itemPriceInput.text()
        if self.itemName and self.itemDesc and self.itemPrice:
            self.accept()
        else:
            QtGui.QMessageBox.warning(self, 'Error', 'Input all fields (correctly)')

    def validateInput(self):
        if not str(self.itemName).isdigit(): return False
        if not str(self.itemDesc).isalpha(): return False

    def getTextFields(self):
        return str(self.itemName), str(self.itemDesc), str(self.itemPrice)

class InventoryAddDialog(QtGui.QDialog, uic.loadUiType("App/inventory_add.ui")[0]):
    def __init__(self, parent=None):
        QtGui.QDialog.__init__(self, parent)
        self.setupUi(self)
        self.catalogDialogAccept.clicked.connect(self.handleInput)
        self.show()

    def handleInput(self):
        self.inventoryItemField = self.inventoryItemField.text()
        self.quantityField = self.quantityField.text()
        if self.inventoryItemField and self.quantityField:
            self.accept()
        else:
            QtGui.QMessageBox.warning(self, 'Error', 'Input all fields (correctly)')

    def getTextFields(self):
        return str(self.inventoryItemField), str(self.quantityField)

class UserAddDialog(QtGui.QDialog, uic.loadUiType("App/inventory_add.ui")[0]):
    def __init__(self, parent=None):
        QtGui.QDialog.__init__(self, parent)
        self.setupUi(self)
        self.catalogDialogAccept.clicked.connect(self.handleInput)
        self.show()

    def handleInput(self):
        self.inventoryItemField = self.inventoryItemField.text()
        self.quantityField = self.quantityField.text()
        if self.inventoryItemField and self.quantityField:
            self.accept()
        else:
            QtGui.QMessageBox.warning(self, 'Error', 'Input all fields (correctly)')

    def getTextFields(self):
        return str(self.inventoryItemField), str(self.quantityField)

class SchoolAddDialog(QtGui.QDialog, uic.loadUiType("App/school_add.ui")[0]):
    def __init__(self, parent=None):
        QtGui.QDialog.__init__(self, parent)
        self.setupUi(self)
        self.schoolDialogAccept.clicked.connect(self.handleInput)
        self.show()

    def handleInput(self):
        self.schoolName = self.schoolNameField.text()
        self.schoolAddress = self.schoolAddressField.text()
        if self.schoolName and self.schoolAddress:
            self.accept()
        else:
            QtGui.QMessageBox.warning(self, 'Error', 'Input all fields (correctly)')

    def getTextFields(self):
        return str(self.schoolName), str(self.schoolAddress)

class TableAddDialog(QtGui.QDialog):
    def __init__(self, tableName, parent=None):
        QtGui.QDialog.__init__(self, parent)
        self.tableName = tableName
        self.show()

    def handleInput(self):
        headers = self.database.getColumnHeaders(self.tableName)
        for i, header in enumerate(headers):
            pass
