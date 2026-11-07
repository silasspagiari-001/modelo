Ext.define('SamosAdmin.atualizacao.portadores.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formportadores',

    //se apagar o CEP, sao sair do campo, ele limpar os dados do endereço automaticamente
    onSairCampoCep: function(campo, evento){
        const vm = this.getViewModel(),
              model = vm.get('model'),
              cepBuscando = campo.getRawValue().replace(/\D/ig, '');

        if( !vm.get('readOnly') && cepBuscando == '' ){
            //Limpa os campos pra evitar confusao
            model.set({
                'PORTADORES_ID_CIDADES' : '',
                'CIDADES_NOME'          : '',
                'CIDADES_ESTADO'        : '',
                'CIDADES_IBGE'          : '',
                'PORTADORES_ENDERECO'   : '',
                'PORTADORES_BAIRRO'     : ''
            });
        }
    },

    verificarCPFCNPJExistente: async function (txt, event) {
        if (!SamosUtils.Events.isTab(event) && !SamosUtils.Events.isEnter(event)) {
            return;
        }

        const view = this.getView();

        try {
            const model = this.getRecord();
            const proximoFoco = this.lookup(txt.proximoFoco);
            const cpfCnpjInformado = SamosUtils.String.onlyNumbers(txt.value);
    
            if (model.getValidation(true).get('PORTADORES_CPFCNPJ') !== true) {
                Ext.defer(txt.focus, 100, txt, [true]);
                throw model.getValidation(true).get('PORTADORES_CPFCNPJ');
            }
            
            if (!model.phantom || this.ignoreDocument(model)) {
                return
            }
            
            view.initGauge('Verificando disponibilidade CPF/CNPJ...');

            const queryCPF = await SamosUtils.Request.nodeApi({
                url: `/consultas/existe`,
                method: 'GET',
                query: {
                    tabela: 'PORTADORES',
                    campo: 'PORTADORES_CPFCNPJ',
                    conteudo: cpfCnpjInformado
                }
            });

            if (queryCPF.results[0]) {
                const portadoresId = queryCPF.results[0]['PORTADORES_ID'];
                Ext.defer(txt.focus, 50, txt, [true]);
                this.carregarPortadorExistente(portadoresId);
                throw 'Já cadastrado!<br><br>Código: ' + portadoresId;
            } else {
                Ext.defer(proximoFoco.focus, 100, proximoFoco, [true]);
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao checar CPF/CNPJ');
        }

        view.stopGauge(true);
    },

    ignoreDocument: function (model) {
        var cpfcnpj = model.get('PORTADORES_CPFCNPJ');

        return cpfcnpj == '99999999000191';
    },

    carregarPortadorExistente: async function(id) {
        const queryPortador = await SamosUtils.Request.nodeApi({
            url: `/portadores`,
            method: 'GET',
            query: {
                conteudo: id,
                ordem: '4',
                status: '2'
            }
        });

        if (queryPortador.results[0]) {
            this.getViewModel().get('model').set(queryPortador.results[0]);
            this.setReadOnly(true);
            this.doDefaultFocus();
            this.getView().applyTextSearches();
        }
    }
});
