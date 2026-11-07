Ext.define('SamosAdmin.movimentos.notaconsumidor.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formnotaconsumidor',

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
            isPassouLimite: function(get){

                if( get('model.MOVIMENTOS_PROTOCOLO').length == 0 ){
                    return false;
                }

                const movimentosEntradaSaida = get('model.MOVIMENTOS_ENTRADASAIDA');
                const movimentosHora = movimentosEntradaSaida + ' ' + get('model.MOVIMENTOS_HORA');

                const enviado = `${movimentosEntradaSaida} ${ moment(movimentosHora).format('hh:mm')}`; 
                const agora   = moment().format('YYYY-MM-DD hh:mm:ss');

                /*
                const diff = Math.abs( enviado.diff(agora, 'minutes') );
                const passouLimite = diff > 30 ? true : false;*/;
                
                const passouLimite = Math.abs( SamosUtils.String.diffDates(moment(agora)._d, moment(enviado)._d, 'minutes', false) ) > 30;

                return passouLimite;
            },

            isEnviado: function(get){
                //force
                get('isCancelado');

                return (get('model.MOVIMENTOS_PROTOCOLO') || '').trim().length > 0;
            },

            hideEmitir: function(get){
                get('isCancelado'); // force
                return false;
            },

            hideStatus: function(get){
                get('isCancelado');
                return false;
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
                return get('isCancelado') || !get('isEnviado');
            },

            hideAlterar: function(get) {  
                return get('isEmUso')    ||
                       get('updating')   || 
                       get('isEnviado') || 
                       get('isCancelado');
            },

            hideExcluir: function(get) {
                return get('isEmUso')     ||
                       get('updating')    || 
                       get('isEnviado') || 
                       get('isCancelado');
            },

            hideCaixa: function(get) {
                return get('isEmUso') || get('updating');
            },

            hideImportar: function (get) {
                get('readOnly')       || 
                parseInt(get('model.MOVIMENTOS_ID_PESSOAS')) > 0 ||
                (
                    get('hideDeOrcamento')  &&
                    get('hideDeRequisicao') &&
                    get('hideDePedido')   
                );
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

            isReprovado: function(get) {
                return get('isSistemaAprovacao') && get('model.MOVIMENTOS_SITUACAO') == 'R';
            },

            isDenegado: function(get) {
                return get('model.MOVIMENTOS_STATUS') == 'D';
            },
            
            isSistemaAprovacao: function(get){
                return configs.getMovimentos().sistemaDeAprovacao;
            },

            hideDeOrcamento: function(get) {
                return this.checkImportacao('ORC', 'Orçamentos');
            },        

            hideDeRequisicao: function(get) {
                return this.checkImportacao('REQ', 'Requisições');
            },
            
            hideDePedido: function(get) {
                return (this.checkImportacao('PED', 'Pedidos'));
            },

            hideOpcoes: function (get) {
                return get('isEmUso') || (get('hideWhatsApp') && get('hideAlterarVendedor'));
            },

            hideLiberar: function (get) {
                return !get('isEmUso');
            },

            hideSaldo: function(get) {
                return !configs.getMovimentos().gridProdutos['SALDOS_DISPONIVEL'] || !get('updating')
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

            hideSefaz: function (get) {
                return get('updating');
            },

            hideWhatsApp: function(get) {
                return !get('readOnly') || get('model.MOVIMENTOS_PROTOCOLO') == '';
            },

            hideAlterarVendedor: function(get) {
                return !get('readOnly') || get('isVendedor')
            },

            isSupervisor: function(get) {
                return configs.getUsuario().privilegiado;
            },

            isVendedor: function(get) {
                return configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor;
            },

            isCancelado: function(get) {
                return get('model.MOVIMENTOS_STATUS') == 'C';
            },

            isFaturado: function(get) {
                return get('model.MOVIMENTOS_STATUS') == 'F';
            },

            isEmUso: function(get) {
                return  get('readOnly') && (
                            get('model.MOVIMENTOS_STATUS') == 'B' ||
                            get('model.MOVIMENTOS_STATUS') == 'M' ||
                            get('model.MOVIMENTOS_STATUS') == 'E' 
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
                return !!get('model.MOVIMENTOS_PROTOCOLO');
            },

            permitidoAlterarPreco: function(get) {
                return  get('model.DOCUMENTOS_ALTERAPRECO') == 'T';
            },

            uiDescontoItem: function(get) {
                return get('isDescontoPorItem') ? ('textbold-' + configs.getTema()): 'field-readonly';
            },

            readOnlyTotalLiquido: function(get){
                return !configs.getMovimentos().alteraLiquido;
            }
        });
    },

    stores: {
        produtos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.notaconsumidor.ModelItens',
            autoLoad: true,
            data: '{model.MOVIMENTOS_ITENS}',
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
