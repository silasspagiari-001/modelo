Ext.define('Overrides.grid.Panel', {
    override: 'Ext.grid.Panel',

    constructor: function () {
        this.callParent(arguments);

        setTimeout(() => {
            if(this.getView() && this.getView().getEl()) {
                this.getView().getEl().dom.onkeydown = e => {
                    this.onKeyDownGrid(e);
                }
            }
        }, 500);
    },

    selectFirst: function () {
        this.getSelectionModel().select(0);
        Ext.defer(this.getView().focusRow, 100, this.getView(), [0]);
    },

    focusSelectedItem: function() {
        const selModel = this.getSelectionModel();
        const index = selModel.selectionStartIdx;

        selModel.select(index);
        Ext.defer(this.getView().focusRow, 100, this.getView(), [index]);
    },

    onKeyDownGrid: function(event) {
        var mainView, controller, refs;

        if(event.keyCode == 27){
            event.stopPropagation();
        }

        setTimeout(() => {
            if (this) {
                mainView = this.getMainView();

                if(mainView){
                    controller = this.getMainController();
                    refs = mainView.getReferences();

                    if (SamosUtils.Events.isEnter(event) && controller.onItemDblClick) {
                        controller.onItemDblClick(this, this.getSelectionModel().getSelection()[0]);

                    } else if (SamosUtils.Events.isEsc(event)) {
                        if (refs['searchtoolbar'] && refs['searchtoolbar'].focus) {
                            refs['searchtoolbar'].focus(true);

                        } else if(controller) {
                            if(this.xtype != 'grideditable') {
                                controller.onSairClick();
                            } else {
                                Ext.defer(this.down('toolbar').focus, 500, this.down('toolbar'));
                            }
                        }

                    } else if (!event.stop && this.down('pagingtoolbar')) {
                        if (SamosUtils.Events.isLeft(event)) {
                            this.down('pagingtoolbar').movePrevious();
                            if(this.selecionarPrimeiroAposBuscar) {
                                this.selectFirst();
                            }

                        } else if (SamosUtils.Events.isRight(event)) {
                            this.down('pagingtoolbar').moveNext();
                            if(this.selecionarPrimeiroAposBuscar) {
                                this.selectFirst();
                            }
                        }
                    }
                }
            }
        }, 100);
    }
});
