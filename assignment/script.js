document.addEventListener('DOMContentLoaded', () => {
    let menuItems = [];
    let tables = [];
    fetchDataFromStorage();

    function fetchDataFromStorage() {
        let ltable = localStorage.getItem('tables');
        const storedtable = JSON.parse(ltable);
        let t = [
            { id: 1, name: 'Table 1', order: [], totalCost: 0, items: 0 },
            { id: 2, name: 'Table 2', order: [], totalCost: 0, items: 0 },
            { id: 3, name: 'Table 3', order: [], totalCost: 0, items: 0 },
            { id: 4, name: 'Table 4', order: [], totalCost: 0, items: 0 }
        ];
        tables = storedtable || t;
        fetchMenuData();
    }

    async function fetchMenuData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error('Failed to fetch the data');
            }
            const data = await response.json();
            menuItems = data.categories.flatMap(category =>
                category.items.map(item => ({ ...item, type: category.name }))
            );
            console.log("Menu Items:", menuItems);
            populateMenu();
            populateTables();
            addDragAndDrop();
        } catch (error) {
            console.error('Error in fetching the data:', error);
        }
    }

    function populateMenu() {
        const menuItemsDiv = document.getElementById('menuItems');
        menuItemsDiv.innerHTML = '';
        if (!Array.isArray(menuItems)) {
            console.error('Menu items is not an array:', menuItems);
            return;
        }
        menuItems.forEach(item => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            cardDiv.setAttribute('draggable', true);
            cardDiv.dataset.id = item.name;
            cardDiv.innerHTML = `
                <div class="row no-gutters">
                    <div class="col-md-4">
                        <img src="${item.image}" class="card-img-top" alt="${item.name}" width="50%">
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h5 class="card-title">${item.name}</h5>
                            <p class="card-text">$${item.price.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            `;
            menuItemsDiv.appendChild(cardDiv);
            cardDiv.addEventListener('dragstart', dragStart);
        });
    }

    function populateTables() {
        const tableListDiv = document.getElementById('tableList');
        tableListDiv.innerHTML = '';

        tables.forEach(table => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('tableCard');
            cardDiv.dataset.id = table.id;
            const totalItem = table.order.reduce((total, item) => total + (item.servings || 0), 0);
            cardDiv.innerHTML = `
                <div class="table-card-body">
                    <h5 class="card-title">${table.name}</h5>
                    <p class="card-text total-items">Items: ${totalItem}</p>
                    <p class="card-text table-total">Total: $${table.totalCost.toFixed(2)}</p>
                </div>`;
            tableListDiv.appendChild(cardDiv);
            cardDiv.addEventListener('click', () => showOrderDetails(table.id));
        });
    }

    function calculateTotal(order) {
        return order.reduce((total, item) => total + item.price * (item.servings || 1), 0);
    }

    function addDragAndDrop() {
        const menuItems = document.querySelectorAll('.card');
        const tableCards = document.querySelectorAll('.tableCard');

        menuItems.forEach(item => {
            item.addEventListener('dragstart', dragStart);
        });

        tableCards.forEach(table => {
            table.addEventListener('dragover', dragOver);
            table.addEventListener('drop', dropItem);
        });
    }

    function dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
    }

    function dragOver(e) {
        e.preventDefault();
    }

    function dropItem(e) {
        e.preventDefault();
        const itemName = e.dataTransfer.getData('text/plain');
        const tableCard = e.target.closest('.tableCard');
        const tableId = tableCard.dataset.id;
        const item = menuItems.find(item => item.name === itemName);
        const table = tables.find(table => table.id == tableId);

        if (item && table) {
            addToTable(table.name, item);
            const totalCostElem = tableCard.querySelector('.table-total');
            totalCostElem.textContent = `Total: $${table.totalCost.toFixed(2)}`;
            const totalItems = table.order.reduce((total, order) => total + (order.servings || 0), 0);
            const totalItemElem = tableCard.querySelector('.total-items');
            totalItemElem.textContent = `Items: ${totalItems}`;

            localStorage.setItem('tables', JSON.stringify(tables));
        }
    }

    function addToTable(tableName, newItem) {
        const table = tables.find(t => t.name === tableName);

        if (table) {
            const existingItem = table.order.find(item => item.name === newItem.name);
            if (existingItem) {
                existingItem.servings = (existingItem.servings || 1) + 1;
            } else {
                newItem.servings = 1;
                table.order.push(newItem);
            }

            table.totalCost = calculateTotal(table.order);
            table.items = table.order.reduce((total, order) => total + (order.servings || 0), 0);
            localStorage.setItem('tables', JSON.stringify(tables));
        }
    }

    function showOrderDetails(tableId) {
        const table = tables.find(table => table.id == tableId);
    
        if (table) {
            const orderDetailsDiv = document.getElementById('orderDetails');
            const tableNameElem = document.getElementById('tableName');
            const totalCostElem = document.getElementById('totalCost');
    
            tableNameElem.textContent = `${table.name} | Orders Details`;
    
            orderDetailsDiv.innerHTML = `
                <table class="table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Item</th>
                            <th>Price</th>
                            <th>Number of Servings</th>
                            <th>Total Price</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${table.order.map((item, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${item.name}</td>
                                <td>$${item.price.toFixed(2)}</td>
                                <td><input type="number" value="${item.servings || 1}" min="1" class="servings" data-index="${index}" data-price="${item.price}"/></td>
                                <td class="item-total">$${(item.price * (item.servings || 1)).toFixed(2)}</td> 
                                <td><button class="btn btn-danger delete-btn" data-index="${index}"><i class="fas fa-trash-alt"></i></button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <button class="btn btn-primary" id="generateBillBtn">Generate Bill</button>
            `;
    
            totalCostElem.textContent = table.totalCost.toFixed(2);
    
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', () => {
                    deleteItem(tableId, button.dataset.index);
                });
            });
    
            document.querySelectorAll('.servings').forEach(input => {
                input.addEventListener('input', (e) => {
                    const index = e.target.dataset.index;
                    const newServingCount = parseInt(e.target.value);
                    table.order[index].servings = newServingCount;
                    updateTotalCost(tableId);
                });
            });
    
            const orderModal = document.getElementById('orderModal');
            orderModal.style.display = 'block'; // Display the modal
    
            document.getElementById('generateBillBtn').addEventListener('click', () => generateBill(table));
        }
    }

    function updateTotalCost(tableId) {
        const table = tables.find(table => table.id == tableId);
    
        if (table) {
            table.totalCost = table.order.reduce((total, item) => total + (item.price * (item.servings || 1)), 0);
            table.items = table.order.reduce((total, item) => total + (item.servings || 0), 0); // Update item count

            const totalCostElem = document.getElementById('totalCost');
            totalCostElem.textContent = table.totalCost.toFixed(2);
    
            const tableCard = document.querySelector(`.tableCard[data-id='${tableId}']`);
            const tableTotalElem = tableCard.querySelector('.table-total');
            tableTotalElem.textContent = `Total: $${table.totalCost.toFixed(2)}`;

            const totalItemElem = tableCard.querySelector('.total-items');
            totalItemElem.textContent = `Items: ${table.items}`; // Update total items
    
            // Update each item's total price in the order details table
            document.querySelectorAll('.servings').forEach(input => {
                const index = input.dataset.index;
                const itemTotalElem = input.closest('tr').querySelector('.item-total');
                const price = parseFloat(input.dataset.price);
                const servings = parseInt(input.value);
                itemTotalElem.textContent = `$${(price * servings).toFixed(2)}`;
            });
    
            // Update tables in localStorage
            localStorage.setItem('tables', JSON.stringify(tables));
        }
    }

    function deleteItem(tableId, itemIndex) {
        const table = tables.find(table => table.id == tableId);
        if (table) {
            const item = table.order[itemIndex];
            table.totalCost -= parseFloat(item.price);
            table.order.splice(itemIndex, 1);
    
            table.items = table.order.reduce((total, item) => total + (item.servings || 0), 0);

        const tableCard = document.querySelector(`.tableCard[data-id='${tableId}']`);
        const totalCostElem = tableCard.querySelector('.table-total');
        totalCostElem.textContent = `Total: $${table.totalCost.toFixed(2)}`;

        const totalItemElem = tableCard.querySelector('.total-items');
        totalItemElem.textContent = `Items: ${table.items}`;showOrderDetails(tableId);

            // Update tables in localStorage
            localStorage.setItem('tables', JSON.stringify(tables));
        }
    }

    function generateBill(table) {
        const billDetailsHTML = `
            <h4>Bill for ${table.name}</h4>
            <table class="table">
                <thead>
                    <tr>
                        <th>S.No</th>
                        <th>Item</th>
                        <th>No of Servings</th>
                        <th>Price of One Serving</th>
                        <th>Total Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${table.order.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.name}</td>
                            <td>${item.servings || 1}</td>
                            <td>$${item.price.toFixed(2)}</td>
                            <td>$${(item.price * (item.servings || 1)).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <h5>Total Cost: $${table.order.reduce((total, item) => total + (item.price * (item.servings || 1)), 0).toFixed(2)}</h5>
            <button class="btn btn-success" id="submitBillBtn">Submit</button>
        `;
        const modalContent = document.querySelector('#billModal .modal-content');
        modalContent.innerHTML = billDetailsHTML;
    
        const billModal = document.getElementById('billModal');
        billModal.style.display = 'block';
    
        const closeModal = () => {
            billModal.style.display = 'none';
            orderModal.style.display='none';
        };
    
        const closeButton = modalContent.querySelector('.close');
        if (closeButton) {
            closeButton.addEventListener('click', closeModal);
        }
    
        const submitButton = modalContent.querySelector('#submitBillBtn');
        if (submitButton) {
            submitButton.addEventListener('click', () => {
                alert('Bill submitted successfully!');
                
            orderModal.style.display='none';
            
                table.order = []; 
                table.totalCost = 0; 

                const storedTables = JSON.parse(localStorage.getItem('tables')) || [];
        const updatedTables = storedTables.map(storedTable => {
            if (storedTable.id === table.id) {
                storedTable.order = []; 
                storedTable.totalCost = 0; 
            }
            return storedTable;
        });
        localStorage.setItem('tables', JSON.stringify(updatedTables));
    
                populateTables();
                closeModal();
            });
        }
    }

    const orderModal = document.getElementById('orderModal');
    const closeModal = orderModal.querySelector('.close');
    const menuSearch = document.getElementById('menuSearch');
    const tableSearch = document.getElementById('tableSearch');

    menuSearch.addEventListener('input', searchMenu);
    tableSearch.addEventListener('input', searchTables);

    const addTableButton = document.getElementById('addTable');
    const addMenuItemButton = document.getElementById('addMenuItem');
    const addTableModal = document.getElementById('addTableModal');
    const addMenuItemModal = document.getElementById('addMenuItemModal');
    const closeAddTableModal = addTableModal.querySelector('.close');
    const closeAddMenuItemModal = addMenuItemModal.querySelector('.close');
    
    const billModal = document.getElementById('billModal');
    const billCloseModal = billModal.querySelector('.close');
    
    const addTableForm = document.getElementById('addTableForm');
    const addMenuItemForm = document.getElementById('addMenuItemForm');

    window.onclick = function(event) {
        if (event.target == orderModal) {
            orderModal.style.display = 'none'; }
        if (event.target == addTableModal) {
            addTableModal.style.display = 'none'; }
        if (event.target == addMenuItemModal) {
            addMenuItemModal.style.display = 'none'; }
        if (event.target == billModal) {
            billModal.style.display = 'none'; }
    }

    function searchMenu() {
        const query = menuSearch.value.toLowerCase();
        const filteredItems = menuItems.filter(item => 
            item.name.toLowerCase().includes(query) || item.type.toLowerCase().includes(query)
        );
        populateFilteredMenu(filteredItems);
    }

    function populateFilteredMenu(filteredItems) {
        const menuItemsDiv = document.getElementById('menuItems');
        menuItemsDiv.innerHTML = '';

        filteredItems.forEach(item => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            cardDiv.setAttribute('draggable', true);
            cardDiv.dataset.id = item.name;
            cardDiv.innerHTML = `
                <div class="row no-gutters">
                    <div class="col-md-4">
                        <img src="${item.image}" class="card-img-top" alt="${item.name} width="50%">
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h5 class="card-title">${item.name}</h5>
                            <p class="card-text">$${item.price.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            `;
            menuItemsDiv.appendChild(cardDiv);
            cardDiv.addEventListener('dragstart', dragStart);
        });
    }

    function searchTables() {
        const query = tableSearch.value.toLowerCase();
        const filteredTables = tables.filter(table => table.name.toLowerCase().includes(query));
        populateFilteredTables(filteredTables);
    }

    function populateFilteredTables(filteredTables) {
        const tableListDiv = document.getElementById('tableList');
        tableListDiv.innerHTML = '';

        filteredTables.forEach(table => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('tableCard');
            cardDiv.dataset.id = table.id;
            cardDiv.innerHTML = `
                <div class="table-card-body">
                    <h5 class="card-title">${table.name}</h5>
                    <p class="card-text table-total">Total: $${calculateTotal(table.order).toFixed(2)}</p>
                </div>`;
            tableListDiv.appendChild(cardDiv);

            cardDiv.addEventListener('click', () => showOrderDetails(table.id));
        });
    }    

    addTableButton.addEventListener('click', () => {
        addTableModal.style.display = 'block';
    });

    addMenuItemButton.addEventListener('click', () => {
        addMenuItemModal.style.display = 'block';
    });

    closeAddTableModal.onclick = function() {
        addTableModal.style.display = 'none'; 
    };

    closeAddMenuItemModal.onclick = function() {
        addMenuItemModal.style.display = 'none';
    };
    
    closeModal.onclick = function() {
        orderModal.style.display = 'none'; 
    };

    billCloseModal.onclick = function() {
        billModal.style.display = 'none';
    };

    addTableForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const tableName = document.getElementById('tableNameInput').value;
        //const tableCost = parseFloat(document.getElementById('tableCost').value);
    
        const newTable = {
            id: tables.length + 1,
            name: tableName,
            order: [],
            totalCost: 0
        };
    
        tables.push(newTable);
        populateTables();
        addTableModal.style.display = 'none';
    
        // Update tables in localStorage
        localStorage.setItem('tables', JSON.stringify(tables));
    });

    addMenuItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const menuItemName = document.getElementById('menuItemName').value;
        const menuItemImage = document.getElementById('menuItemImage').value;
        const menuItemPrice = parseFloat(document.getElementById('menuItemPrice').value);
        const menuItemCategory = document.getElementById('menuItemCategory').value;

        const newItem = {
            name: menuItemName,
            price: menuItemPrice,
            type: menuItemCategory,
            image: menuItemImage
        };

        menuItems.push(newItem);
        localStorage.setItem('menuItems', JSON.stringify(menuItems));
        populateMenu();
        addMenuItemModal.style.display = 'none';
    });

    fetchDataFromStorage();
});
