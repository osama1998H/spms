frappe.ui.form.on('Sales Team', {
    refresh(frm) {
        for (const element of frm.doc.sales_team) {
            element.incentives = frm.doc.net_total * (element.commission_rate / 100);
        }
        frm.refresh();
    }
});



frappe.ui.form.on('Sales Invoice', {
    refresh(frm) {
        // Set page length to show all items
        frm.get_field("items").grid.grid_pagination.page_length = 99_999;

        frappe.require([
            'assets/spms/node_modules/onscan.js/onscan.js',
        ], () => {
            // Enable scan events for the entire document
            onScan.attachTo(document);
            document.addEventListener('scan', async (event) => {
                const { scanCode: sScanned, qty: iQty } = event.detail;

                const existingItem = frm.doc.items.find(item => item.barcode == sScanned);
                if (existingItem) {
                    existingItem.qty += 1;
                    updateItem(existingItem, frm);
                } else {
                    const respItem = await searchItemByBarcode(sScanned);
                    if (respItem) {
                        const row = frm.add_child('items', {
                            barcode: sScanned,
                            item_code: respItem.parent,
                            item_name: respItem.parent,
                            description: respItem.parent,
                            qty: iQty,
                            uom: respItem.uom
                        });
                        updateItem(row, frm);
                    }
                }
            });
        });
    },
});

// Function to update item in the table
function updateItem(item, frm) {
    frm.refresh_field("items");
    frm.reload()
    const element = document.querySelector(`[data-name="${item.name}"]`);
    if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        element.style.border = '2px solid blue';

        setTimeout(() => { element.style.border = 'none'; }, 5000);
    } else {
        console.log('Element with data-name attribute not found');
    }
}

// Function to search item by barcode
function searchItemByBarcode(barcode) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: 'spms.methods.utils.search_item_by_barcode',
            args: { barcode, parent_doc: "Item" },
            callback(r) {
                if (r.message) {
                    resolve(r.message);
                } else {
                    reject(new Error('Item not found'));
                }
            }
        });
    });
}