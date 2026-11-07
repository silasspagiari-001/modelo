Ext.define('SamosAdmin.movimentos.telemarketing.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formtelemarketing',

    onNovoClick: async function (btn, event) {

        const pessoa = this.getRecord();        
        const record = Ext.create('SamosAdmin.movimentos.telemarketing.Model'); 

        record.set({
            'TELEMARKETING_ID_PESSOAS'  : pessoa.get('PESSOAS_ID'),
            'PESSOAS_NOME'              : pessoa.get('PESSOAS_NOME'),
            'PESSOAS_TELEFONE'          : pessoa.get('PESSOAS_TELEFONE'),
            'PESSOAS_CELULAR'           : pessoa.get('PESSOAS_CELULAR'),            
        });

        const view = Ext.create({
            xtype: 'formdetalhestelemarketing'
        });

        view.getViewModel().set({
            readOnly: false,
            model: record
        });

        view.lookup('contato').focus(true);

    },

    onItemDblClick: async function(grid, record) {
        const view = Ext.create({
            xtype: 'formdetalhestelemarketing',
            permissoes: this.getView().getPermissoes()
        });

        view.getViewModel().set({
            'initialValues': record.getData(),
            'previousModel': undefined,
            model: record,
            readOnly: true
        });
    }
});
