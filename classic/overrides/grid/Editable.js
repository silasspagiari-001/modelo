Ext.define('Ext.grid.EditableGrid', {
    extend: 'Ext.grid.Panel',
    xtype: 'grideditable',

    scrollable: 'vertical',
    layout: 'fit',
    margin: '0 0 10 0',
    addAfterSave: true,

    // *********************************************************************************** 
    // Begin Events 
    // *********************************************************************************** 
 
    /**
     * @event afteraddclick
     * Este evento é disparado após clicar no botão adicionar
     * @param {Ext.grid.Panel} this
     * @param {Ext.data.Model} Model adicionado
     */

     /**
     * @event afterremoveclick
     * Este evento é disparado após clicar no botão remover
     * @param {Ext.grid.Panel} this
     */

     /**
     * @event aftersaveitem
     * Este evento é disparado após um item ser salvo
     * @param {Ext.grid.Panel} this
     * @param {Ext.data.Model} Model salvo
     * @param {boolean} noAddNew se true não adiciona mais um item na grid apó salvar
     */
 
    // *********************************************************************************** 
    // End Events 
    // *********************************************************************************** 

    constructor: function (grid) {
        const tbar = [];
        const plugins = grid.readOnly ? '' : 'rowediting';
        const tema = configs.getTema();

        if(!grid.readOnly && !grid.hideButtons) {
            tbar.push({
                xtype: 'button',
                text: 'Adicionar',
                reference: 'add' + grid.reference,
                ui: 'primary-' + tema,
                listeners: {
                    click: (btn, e) => {
                        this.onAddClick(btn, e);
                    }
                },
                margin: 5,
                bind: {
                    hidden: '{readOnly}'
                }
            });

            tbar.push({
                xtype: 'button',
                text: 'Remover',
                reference: 'remove' + grid.reference,
                listeners: {
                    click: (btn, e) => {
                        this.onRemoveClick(btn, e);
                    }
                },
                ui: 'primary-' + tema,
                margin: 5,
                bind: {
                    hidden: '{readOnly}'
                }
            });
        }

        if(tbar.length) {
            Ext.apply(this, { tbar: tbar });
        }

        if(!!plugins) {
            Ext.apply(this, { plugins: plugins });
        }

        if(!grid.hideNumberer) {
            grid.columns.items.unshift({
                xtype: 'rownumberer'
            });
        }

        this.callParent(arguments);

        this.on('aftersaveitem', this.toNextItem);
        Ext.defer(this.addSaveOnTabListener, 2800, this);
    },

    addSaveOnTabListener: function () {
        if(this.columns) { 
            this.columns.reverse();
            this.columns.some(column => {
                var vm = this.getMainViewModel(),
                    condition, editor;                
    
                if(column.getEditor) {
                    editor = column.getEditor();
                    condition = editor.xtype != 'button' && editor.xtype != 'displayfield';  
    
                    if(editor.getBind && editor.getBind() && editor.getBind().ui) {
                        condition = condition && editor.getBind().ui.getValue() != 'field-readonly';
                    } else if(editor.bind && editor.bind.ui) {
                        condition = condition && vm.get(editor.bind.ui.getValue().slice(1, -1)) != 'field-readonly';
                    } else {
                        condition = condition && editor.ui != 'field-readonly';
                    }
    
                } else {
                    condition = false;
                }
    
                if(condition) {
                    if(editor.xtype == 'samoswidgets-textsearch'){
                        editor.callbackFn = (txt, record) => {
                            this.onTabItem(txt, { keyCode: 9 });
                        };
    
                    } else {
                        editor.on('specialkey', (txt, event) => {
                            this.onTabItem(txt, event);
                        });
                    }
                };
    
                return condition;
            });
    
            this.columns.reverse();
        }
    },

    onAddClick: function () {
        const parentModel = this.getMainController().getRecord();
        const rowediting = this.getRowEditing();
        const store = this.getStore();
        const editingItems = this.getEditingItems();
        const valid = editingItems ? this.validarItens() : editingItems;

        if (editingItems && !valid) {
            return;
        }

        const newItem = Ext.create(store.config.model);

        newItem.set(newItem.getIdParent(),   parentModel.get(parentModel.getIdProperty()));
        newItem.set(newItem.getIdProperty(), (store.getCount() + 1) * - 1);
        newItem.setEditing(true);
        newItem.setCancelable(true);
        store.insert(store.getCount(), newItem);
        Ext.defer(rowediting.startEdit, 100, rowediting, [newItem, 0]);
        this.fireEvent('afteraddclick', this, newItem);
    },

    onRemoveClick: function (btn, e) {
        const store = this.getStore();
        const item = this.getSelectionModel().getSelection()[0];

        store.remove(item);

        if(this.getMainController().iniciarEdicao){
            this.getMainController().iniciarEdicao();
        }

        if (store.getCount()) {
            this.getSelectionModel().select(0);
        }

        this.fireEvent('afterremoveclick', this);        
    },

    validarItens: function (noAddNew) {
        if(!this.getRowEditing()) { return true; }
        
        const itemEditing = this.getEditingItems()[0];
        const store = this.getStore();
        const fields = this.getRowEditing().editor.items.items;

        if (itemEditing) {
            fields.forEach(field => {
                itemEditing.set(field.name, field.getValue());
            });
            if(this.permitidoDescartar(itemEditing)) {
                store.remove(itemEditing);
                return this.temPeloMenosUmItem();
            } else if (this.getMainController().validateModel(itemEditing, fields)) {
                this.saveItem(itemEditing, noAddNew);
                return true;
            } else {
                return false;
            }

        } else {
            return this.temPeloMenosUmItem();
        }
    },

    temPeloMenosUmItem: function() {
        const store = this.getStore();

        if(!store.getCount() && !this.hideButtons) {
            Ext.Note('warning', 'Adicione pelo menos um item');
            this.onAddClick();
            return false;
        } else {
            return true;
        }
    },

    permitidoDescartar: function (item) {
        const idProperty = item.getIdProperty();
        const idParent = item.getIdParent();
        
        return item.getFields()
            .filter(field => {
                return field.name != idProperty && field.name != idParent && field.name != undefined;
            })
            .every(field => {
                const value = item.get(field.name);

                if(value == item.defaultValues[field.name]) {
                    return true;
                } else if(value && parseFloat(value) === 0){
                    return true;
                } else {
                    return !value;
                }
            });
    },

    getEditingItems: function () {
        const store = this.getStore();

        if (store) {
            const items = store.data.items.filter(item => item.isEditing());
            return items[0] ? items : false;
        } else {
            return false;
        }
    },

    onTabItem: function (txt, event) { //saveItem on tab last field
        if (SamosUtils.Events.isTab(event) || SamosUtils.Events.isEnter(event)) {
            Ext.defer(this.saveItem, 100, this);
        }
    },

    saveItem: function (item = this.getSelection()[0], noAddNew) {
        const rowediting = this.getRowEditing();
        const fields = rowediting.editor.items.items;

        fields.filter(field => field.dataIndex)
              .map(field => item.set(field.dataIndex, field.getValue()));

        if (this.getMainController().validateModel(item, fields)) {
            this.getMainView().initGauge('Salvando item...');            
            rowediting.completeEdit();
            item.setCancelable(false);
            item.setEditing(false);
            this.fireEvent('aftersaveitem', this, item, noAddNew);
            this.getMainView().stopGauge(true);                        
        }
    },

    toNextItem: function(grid, model, noAddNew) {
        const items = this.getStore().data.items;
        const rowediting = this.getRowEditing();
        const nextModel = items.reduce((next, item, index) => {
                return model.id == item.id ? items[index + 1] : next;
            }, undefined);

        if (!this.hasConfirm() && !noAddNew) {
            if (nextModel) {

                Ext.defer(rowediting.startEdit, 500, rowediting, [nextModel, 0]);
            } else if (!this.getEditingItems() && !this.hideButtons && this.addAfterSave) {
                this.onAddClick();
            }
        }
    },

    hasConfirm: function () {
        const confirm = Ext.$('window[id^="messagebox"]')[0];
        return confirm && !confirm.hidden;
    },
    
    getRowEditing: function() {
        return this.getPlugins() ? this.getPlugins()[0] : null;
    }
});
