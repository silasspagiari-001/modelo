Ext.define('Overrides.MessageBox', {
    override : 'Ext.MessageBox',
 
    statics: {
        YES   : {text: 'Sim',    itemId: 'yes'},
        NO    : {text: 'Não',     itemId: 'no'},
        CANCEL: {text: 'Cancelar', itemId: 'cancel'},
        INFO    : Ext.baseCSSPrefix + 'msgbox-info',
        WARNING : Ext.baseCSSPrefix + 'msgbox-warning',
        QUESTION: Ext.baseCSSPrefix + 'msgbox-question',
        ERROR   : Ext.baseCSSPrefix + 'msgbox-error',
        OKCANCEL: [
            {text: 'Cancelar', itemId: 'cancel'},
            {text: 'OK',     itemId: 'ok'}
        ],
        YESNOCANCEL: [
            {text: 'Cancelar', itemId: 'cancel'},
            {text: 'Não',     itemId: 'no'},
            {text: 'Sim',    itemId: 'yes'}
        ],
        YESNO: [
            {text: 'Não',  itemId: 'no'},
            {text: 'Sim', itemId: 'yes'}
        ]
    }
});
 