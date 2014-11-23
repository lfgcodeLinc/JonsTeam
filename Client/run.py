__author__ = 'David'

import sys
from PyQt4 import QtGui
from PyQt4.QtCore import *

from App.gui import GUI

def main():
    app = QtGui.QApplication(sys.argv)
    gui = GUI()
    gui.show()
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()
