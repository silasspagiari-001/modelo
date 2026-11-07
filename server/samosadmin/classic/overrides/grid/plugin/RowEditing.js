Ext.define('Overrides.grid.plugin.RowEditing', {
    override: 'Ext.grid.plugin.RowEditing',

    clicksToMoveEditor: 2,
    errorSummary: false,

    hideButtons: function() {
        if (this.editor && this.editor.floatingButtons) {
            this.editor.floatingButtons.hide();
        } else {
            Ext.defer(this.hideButtons, 5, this);
        }
    },

    //override
    onEnterKey: Ext.emptyFn,

    listeners: {
        beforeedit: function(editor, context) {
            const grid = context.grid;
            const store = grid.getStore();
            const editingItems = grid.getEditingItems();
            const form = editor.editor.getForm();
            const fields = editor.editor.items.items;
            const record = context.record;
            let abandonedItem;

            if(editingItems){
                abandonedItem = editingItems.find(item => item.id != record.id);
            }

            if(abandonedItem){
                fields.filter(field => field.dataIndex)
                      .map(field => {
                          return abandonedItem.set(field.dataIndex, field.getValue())
                      });

                if(grid.permitidoDescartar(abandonedItem)) {
                    store.remove(abandonedItem);
                    record.setEditing(true);
                    
                } else if (grid.getMainController().validateModel(abandonedItem, fields) && form.isValid()) {
                    this.completeEdit();
                    abandonedItem.setCancelable(false);
                    abandonedItem.setEditing(false);
                    record.setEditing(true);
                    grid.fireEvent('aftersaveitem', this, abandonedItem);
                } else {
                    abandonedItem.setEditing(true);
                    abandonedItem.setCancelable(true);
                    Ext.defer(this.startEdit, 100, this, [abandonedItem, 0]);
                }
            } else {
                record.setEditing(true);
            }
        
            Ext.defer(this.hideButtons, 50, this);

            setTimeout(() => {
                editor.editor.query('samoswidgets-textsearch').map(txt => {
                    if (!this.hasUnsearchedIds) {
                        txt.setSearchedId(parseInt(txt.getValue()));
                    }
                });
            }, 200);
        },

        canceledit: function (editor, context) {
            const grid = context.grid;
            const model = context.record;
            const store = grid.getStore();

            if (model && model.getCancelable()) {
                store.remove(model);
            }


            if (store.getCount() > 0) {
                store.remove(model); // Remove o último item.
                grid.selectFirst();
            }

            context.record.setEditing(false);
        },

        edit: function (editor, context) {
            var textsearchs = editor.editor.query('samoswidgets-textsearch');

            context.record.setEditing(false);

            for (var i in textsearchs) {
                if ((textsearchs[i].getSearchedId().toString() == 'NaN') || (parseInt(textsearchs[i].getValue()).toString() == 'NaN')) {
                    context.record.set(textsearchs[i].dataIndex, '');
                } else if (textsearchs[i].getSearchedId() != parseInt(textsearchs[i].getValue())) {
                    context.record.set(textsearchs[i].dataIndex, textsearchs[i].getSearchedId())
                    this.startEdit(context.record);
                    Ext.Note('warning', 'Pesquise');
                    this.hasUnsearchedIds = true;
                    return;
                }
            }

            this.hasUnsearchedIds = false;
        }
    }
});
