Ext.define('SamosAdmin.movimentos.notaservicos.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formnotaservicos',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            isVendaConsumidor: false,
            digitouDescontoCabecalho: false,
            digitouDescontoCabecalhoEmDinheiro: false,
            digitouDescontoCabecalhoEmPercentual: false,
            digitouDescontoItem: false          
        });

        this.setFormulas({

            isEnviado: function(get){
                //force
                get('isCancelado');

                return get('model.ORDENS_PROTOCOLO').length > 0;
            },

            hideEmitir: function(get){
                //force
                get('isEnviado');
                get('isCancelado');

                return get('isEnviado');
            },

            hideReemitir: function(get){
                //force
                get('isEnviado');
                get('isCancelado');

                return !get('isEnviado');
            },

            hideEmail: function(get){
                //force
                get('isEnviado');
                get('isCancelado');

                return get('isCancelado') ||
                       !get('isEnviado');
            },

            hideCancelamento: function(get){
                //force
                get('isEnviado');
                get('isCancelado');

                if( get('isCancelado') ){ return true };

                return false;

            },

            hideAlterar: function(get) {  
                return get('isEmUso')    ||
                       get('updating'); 
            },

            hideExcluir: function(get) {
                return get('isEmUso') ||
                       get('updating');
            },

            hideCaixa: function(get) {
                return get('isEmUso') || get('updating');
            },

            hideImportar: function (get) {
                return get('readOnly') || 
                       parseInt(get('model.ORDENS_ID_PESSOAS')) > 0 ||
                        (
                            get('hideDeOrdemServico')
                        );
            },
            
            hideDeOrdemServico: function (get) {
                return get('readOnly') || 
                       parseInt(get('model.ORDENS_NUMEROORIGEM'))
            },

            hideDeXml: function (get) {
                return get('readOnly')
            },
            
            hideExportar: function(get) {
                //return false;
                return get('updating')    || 
                       get('isEmUso')     ||
                       get('isReprovado') || 
                       get('isCancelado') ||
                       get('isDenegado')  ||
                       !get('isEnviado')
            },

            isDenegado: function(get) {
                return get('model.ORDENS_STATUS') == 'D';
            },
            
            hideOpcoes: function (get) {
                return get('isEmUso') || get('hideAlterarEmissao') || get('hideAlterarVendedor');
            },

            hideLiberar: function (get) {
                return !get('isEmUso');
            },

            cartoesObrigatorio: function(get) {
                return get('model.DOCUMENTOS_COLETACARTAO') == 'T';
            },

            entregaObrigatoria: function(get) {
                return get('model.DOCUMENTOS_COLETAENTREGA') == 'T';
            },

            outroObrigatorio: function(get) {
                return get('model.DOCUMENTOS_COLETAOUTRO') == 'T';
            },

            hideImprimir: function (get) {
                return false;
            },

            hideSefaz: function (get) {
                return true;
//                return get('updating');
            },

            hideAlterarEmissao: function(get) {
                return !get('readOnly') || get('model.ORDENS_STATUS') != 'N'
            },

            hideAlterarVendedor: function(get) {
                return !get('readOnly') || get('isVendedor')
            },

            disableFechar: function (get) {
                return get('editionClosed');
            },

            isSupervisor: function(get) {
                return configs.getUsuario().privilegiado;
            },

            isVendedor: function(get) {
                return configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor;
            },

            isCancelado: function(get) {
                return get('model.ORDENS_STATUS') == 'C';
            },

            isFaturado: function(get) {
                return get('model.ORDENS_STATUS') == 'F';
            },

            isEmUso: function(get) {
                return  get('readOnly') && (
                            get('model.ORDENS_STATUS') == 'B' ||
                            get('model.ORDENS_STATUS') == 'M' ||
                            get('model.ORDENS_STATUS') == 'E' 
                        );
            },

            isDescontoPorItem: function(get) {
                return get('model.DOCUMENTOS_DESCONTOITEM') == 'T';
            },

            isDescontoCabecalho: function(get) {
                return get('model.DOCUMENTOS_DESCONTOITEM') == 'F';
            },

            isDescontoPorItemECabecalho: function(get) {
                return get('model.DOCUMENTOS_DESCONTOITEM') == 'A';
            },

            marcaDaguaStyle: function(get) {
                let color;
                let text;

                if(get('isCancelado')) {
                    text  = 'Cancelado';
                    color = 'rgb(255,0,0,0.3)';
                } else if(get('isEmUso')) {
                    text  = 'Em Uso';
                    color = 'rgb(255,0,0,0.3)';
                } else {
                    text  = this.getView().title;
                    color = 'rgb(0,0,0,0.3)';
                }

                this.set('marcaDaguaText', text.toUpperCase());

                return {
                    padding: '0px 0px 0px 0px',
                    textAlign: 'center',
                    fontSize: '25px',
                    fontFamily: 'monospace',
                    letterSpacing: '3px',
                    color: color,
                    height: '0px',
                    lineHeight: '38px',
                    fontWeight: 'bold'
                };
            },

            hasProtocolo: function(get) {
                return !!get('model.ORDENS_PROTOCOLO');
            },

            permitidoAlterarPreco: function(get) {
                return  get('model.DOCUMENTOS_ALTERAPRECO') == 'T';
            },

            uiDescontoItem: function(get) {
                return get('isDescontoPorItem') ? ('textbold-' + configs.getTema()): 'field-readonly';
            },

            readOnlyTotalLiquido: function(get){
                return !configs.getMovimentos().alteraLiquido;
            },

            prestacaoAssociations: function(get) {
                const codigoAtividade =  get('model.ORDENS_CODIGOSERVICO');

                return codigoAtividade == '14.14' ? 
                    [
                        ['CIDADES_NOMEPRESTACAO',   'CIDADES_NOME'],
                        ['CIDADES_ESTADOPRESTACAO', 'CIDADES_ESTADO'],
                        ['ORDENS_ID_CIDADES',       'CIDADES_ID'],
                    ] : [
                        ['CIDADES_NOMEPRESTACAO',    'CIDADES_NOME'],
                        ['CIDADES_ESTADOPRESTACAO',  'CIDADES_ESTADO'],
                        ['ORDENS_ID_CIDADES',        'CIDADES_ID'],
                        ['CIDADES_NOMEINCIDENCIA',   'CIDADES_NOME'],
                        ['CIDADES_ESTADOINCIDENCIA', 'CIDADES_ESTADO'],
                        ['ORDENS_IDSKY',             'CIDADES_ID'],
                    ];
            },

        });
    },

    stores: {
        servicos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.notaservicos.ModelItens',
            autoLoad: true,
            data: '{model.ORDENS_SERVICOSITENS}',
            proxy: {
                type: 'memory'
            }
        }
    },

    checkImportacao: function(module, name) {
        const cfg = configs.getMovimentos().exportacao[module];

        if(Permissao.services.Model.podeLer({
            groupName: 'Movimentos',
            moduleName: name
        })) {
            if(cfg && cfg[0]){
                return !cfg.includes('NFC');
            } else {
                return true;
            }
        } else {
            return true;
        }
    }
});
