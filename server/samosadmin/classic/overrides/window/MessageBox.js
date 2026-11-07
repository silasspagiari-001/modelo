Ext.define('Overrides.window.MessageBox', {
    override: 'Ext.window.MessageBox',

    show: function () {
        const me = this.callParent(arguments);
        const tema =  configs.getTema();
        const txt = this.down('textfield');

        this.down('button[text="Sim"]').setUI('primary-' + tema);
        this.down('button[text="OK"]').setUI('primary-' + tema)
        this.down('button[text="Não"]').setUI('tertiary-' + tema);
        this.down('button[text="Cancelar"]').setUI('tertiary-' + tema);
        
        if(txt) {
            txt.setUI('textbold-' + tema);
            Ext.defer(txt.focus, 100, txt);
        }

        return me;
    },

    buttonText: {
        ok: 'OK',
        yes: 'Sim',
        no: 'Não',
        cancel: 'Cancelar'
    },

    titleText: {
        confirm: 'Confirmação',
        prompt: 'Caixa de Texto',
        wait: 'Carregando...',
        alert: 'Atenção'
    },

    confirmDelete: function (callback) {
        const msgCmp = Ext.create({
            xtype: 'component',
            style: 'margin:15px 0px;font-weight:bold;font-size:16px;color:red',
            html:  'Deseja realmente excluir?'
        });

        const dialog = Ext.Msg.confirm('Confirmação', msgCmp, callback);

        dialog.down('button[text="Sim"]').setStyle({
            backgroundColor:'red',
            borderColor: 'red'
        });
    },

    confirmCancel: function (callback) {
        var dialog,
            msgCmp = Ext.create({
                xtype: 'component',
                style: 'margin:15px 0px;font-weight:bold;font-size:16px;color:red',
                html:  'Deseja realmente cancelar?'
            }),
            btnStyle = {
                backgroundColor:'red',
                borderColor: 'red'
            };

        dialog = Ext.Msg.confirm('Confirmação', msgCmp, callback);

        dialog.down('button[text="Sim"]').setStyle(btnStyle);
    }
});
