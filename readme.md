This project uses docker-compose in order to automatically build a container with the database, frontend and backend. All that should need to be done to run the project is to run the command

docker-compose up -d

The dockerbuild files and docker-compose file should automatically setup with proper credentials. When the server initializes it will generate a private and public key into a .env file to persist data past shutdown. The database should also persist.

How to Use:

Visitor: Unable to edit, add, or remove items. They can select a manager to see all of their inventory or an item to see the item details.

Inventory Manager:
Currently all inventory managers may edit any manager's items. There was no authentication requirement for inventory managers to only be able to change their items.

To Edit an item:
Simply go to an item details page by clicking on the item title. You may click on text to change it then click submit to change any item.

To add an item:
Go to the inventory manager's page and click add item. Fill in the details and click confirm.

To Delete Items:
Simply select a checkbox, select delete item then select confirm.

When on the item details page may edit any aspect of the item except for the ID and manager.

Potential Bugs:
-Logout may not take effect. Current workaround is to simply logout again and it should succeed.
