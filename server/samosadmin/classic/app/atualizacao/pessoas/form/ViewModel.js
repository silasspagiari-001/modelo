Ext.define('SamosAdmin.atualizacao.pessoas.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formpessoas',

    constructor: function () {
        this.callParent(arguments);
        
        this.setData({
            cadastroCpfDuplicadoLiberado: false,
            jaClicouBotaoCopiarPelaPrimeraVez: false,
            ultimoTipoCliente: null,
            tipoOriginalCliente: null
        });

        this.setFormulas({

            hideParametrosTransporte: function (get) {
                return configs.getClientName() != 'prudenmoveis' ||
                       get('updating') ||
                       (get('model.PESSOAS_TIPO') != 'N' && get('model.PESSOAS_TIPO') != 'O');
            },

            hideParametrosFornecedor: function (get) {
                return configs.getClientName() != 'prudenmoveis' ||
                       get('updating') ||
                       get('model.PESSOAS_TIPO') != 'B';
            },

            hidePrecos: function (get) {
                return get('updating') ||
                       !configs.getPessoas().precoEspecifico ||
                       get('model.PESSOAS_TIPO') != 'A'
            },

            hideDocumentos: function (get) {
                return get('updating') ||
                       !configs.getPessoas().documentos
            },

            hidePropriedades: function (get) {
                return get('updating') ||
                       !configs.getPessoas().propriedades
            },

            hideAssistencias: function (get) {
                return get('updating') ||
                       !configs.getPessoas().assistencias
            },

            hideHistorico: function (get) {
                return get('updating');
            },

            hideImprimir: function(get) {
                return get('updating');
            },

            hideCobranca: function (get) {

                let catPessoa = get('model.PESSOAS_CATEGORIA');

                return configs.getClientName() == 'stilomoveis' && catPessoa == '1';  // Não contribuinte na Stilo
            },

            hideIncluirPedido: function (get) {
                return configs.getClientName() != 'stilomoveis' || get('updating');
            },

            hideIncluirOrcamento: function (get) {
                return configs.getClientName() != 'stilomoveis' || get('updating');
            },

            hideSefaz: function(get) {
                return !get('updating');
            },

            labelCpfCnpj: function(get) {
                return get('naturezaJuridica') ? 'CNPJ' : 'CPF';
            },

            labelInscricao: function(get) {
                return get('naturezaJuridica') ? 'Inscrição' : 'RG';
            },

            pageIsMail: function(get) {
                let labelCampoPagina = configs.getPessoas().labelPagina || '';
                return labelCampoPagina.match(/mail/);
            },            

            fantasiaIsMail: function(get) {
                let labelCampoFantasia = configs.getPessoas().labelFantasia || 'Nome Fantasia';
                return labelCampoFantasia.match(/mail/);
            },            

            isCepUnico: function(get) {
                var cep = get('model.PESSOAS_CEP');

                let sufixo = (cep || '').substring(5, 8);

                return sufixo == '000';
            },

            isSupervisor: function(get) {
                return configs.getUsuario().privilegiado;
            },

            isColaboradorPrudenMoveis: function (get) {
                return configs.getClientName() == 'prudenmoveis' &&
                       get('model.PESSOAS_TIPO') == 'I'
            },

            tipoRestrito: function(get) {
                return configs.getClientName() == 'stilomoveis' &&
                       !configs.getUsuario().privilegiado &&
                       get('model.PESSOAS_TIPO') == 'N';
            },

            naturezaJuridica: function(get) {
                var natureza = get('model.PESSOAS_NATUREZA');

                natureza = natureza ? natureza.toUpperCase() : undefined;

                return natureza != 'FISICA';
            },

            naturezaFisica: function(get) {
                return !get('naturezaJuridica');
            },

            usarCampoRG: function(get) {
                return configs.getPessoas().usarCampoRG ? true : false;
            },

            readOnlyPrivilegiado: function(get) {
                return get('readOnly') || !configs.getUsuario().privilegiado;
            },

            getUrlImage: async function (get) {
                const foto = get('model.FOTO') || '';

                if(foto == 'sem_foto') {
                    this.set('urlImage', location.href + 'resources/images/sem_foto.jpg');
                } else if(foto.slice(0, 4) == 'data') {
                    this.set('urlImage', foto);
                } else {
                    this.set('urlImage', configs.getApiNode() + foto);
                }
            }
        });
    }
});
