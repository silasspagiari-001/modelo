Ext.define('SamosAdmin.atualizacao.portadores.services.Model', {
    alternateClassName: 'Portador.services.Model',
    singleton: true,

    get: function(id) {
        const store = this.instanciarStore();
        store.getProxy().setExtraParam('conteudo', id);

        return store.load()
            .then(records => records[0])
            .catch(() => Ext.Note('error', 'Erro no servidor'));
    },

    instanciarStore: function() {
        return Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.atualizacao.portadores.Model',
            proxy: {
                url: 'server/portadores',
                extraParams: {
                    ordem: 4,
                    status: 2,
                    start: 0,
                    limit: 1
                }
            }
        });
    },

    validar: function(txt, portador, vm){
        const agencia  = portador.get('PORTADORES_AGENCIA')  || '';
        const conta    = portador.get('PORTADORES_CONTA')    || '';
        const convenio = portador.get('PORTADORES_CONVENIO');
        const carteira = portador.get('PORTADORES_CARTEIRA');
        const digitoAgencia = agencia.toString().split('-')[1];
        const digitoConta   = conta.toString().split('-')[1];

        let valido = true;

        if(isNaN(carteira) || carteira < 0 || carteira === null) {
            Ext.Note('warning', 'Carteira inválida');
            valido = false;
        } else if(isNaN(convenio) || convenio < 0 || convenio === null) {
            Ext.Note('warning', 'Convênio inválido');
            valido = false;
        } else if(!digitoAgencia || digitoAgencia.length < 1) {
            Ext.Note('warning', 'Agência inválida');
            valido = false;
        } else if(!digitoConta || digitoConta.length != 1) {
            Ext.Note('warning', 'Conta inválida');
            valido = false;
        }

        if(!valido) {
            setTimeout(() => {
                vm.set({
                    valuePortador:   '',
                    valueIdPortador: undefined
                });
    
                txt.setSearchedId(undefined);
                txt.focus(true);
            }, 500);
        }

        return valido;
    }
});
