Ext.define('SamosAdmin.movimentos.movimento.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formmovimentos',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            jaDigitouSenha: false,
            isVendaConsumidor: false,
            comLoteLiberado: false,
            comSaldoLiberado: false,
            statusBloqueado: '',
            digitouDescontoCabecalho: false,
            digitouDescontoCabecalhoEmDinheiro: false,
            digitouDescontoCabecalhoEmPercentual: false,
            digitouDescontoItem: false,
            boletoImpresso: false,
            markupAtivo: false,
            custoAtivo: false,
            isConsultaKardex: false,  
            pesoNfeInformadoManual: false,   

            //Usado pra nao dar problema de binding no campo "Vlr Subst" quando ele é usado como "Restante" na pruden aco
            bidingNulo: 0,
            readOnlyNulo: true
        });

        this.setFormulas({
            hideAlterar: function(get) {
                //force
                get('isOrcamento');
                get('isRequisicao');

                return get('isEmUso')     ||
                       get('updating')    || 
                       get('isReprovado') || 
                       get('isCancelado') || 
                       get('isDenegado')  || 
                       get('isNotaEmitida') ||
                       (get('isPedido') && get('isFaturado') && configs.getClientName() == 'casanova') ||
                       (configs.getClientName() == 'hospitalar' && get('isPedido') &&
                       !(get('model.MOVIMENTOS_STATUS') == 'M' || get('model.MOVIMENTOS_STATUS') == 'N')) ||
                       (
                           get('isTransferencia') &&
                           (get('isFaturado') ||get('isNotaEmitida'))
                       ) || 
                       (
                           get('isPedido') &&
                           get('model.MOVIMENTOS_SERIEORIGEM') == 'ORC' &&
                           get('model.MOVIMENTOS_FORMASPAGAMENTO')      &&
                           get('model.MOVIMENTOS_FORMASPAGAMENTO')[0]
                       ) || 
                       (
                           get('isOrcamento') &&
                           (get('model.MOVIMENTOS_SERIEORIGEM') == 'PE' || get('model.MOVIMENTOS_SERIEORIGEM') == 'PV') &&
                           get('model.MOVIMENTOS_FORMASPAGAMENTO')      &&
                           get('model.MOVIMENTOS_FORMASPAGAMENTO')[0]
                       );
            },

            hideExcluir: function(get) {
                return get('isEmUso')     ||
                       get('updating')    || 
                       get('isReprovado') || 
                       get('isCancelado') || 
                       get('isDenegado')  || 
                       get('isNotaEmitida') ||                       
                       (
                           get('isTransferencia') &&
                           get('isNotaEmitida')
                       ) || 
                       (
                           get('isOrcamento') &&
                           get('model.MOVIMENTOS_SERIEORIGEM') == 'PED' &&
                           get('model.MOVIMENTOS_FORMASPAGAMENTO')      &&
                           get('model.MOVIMENTOS_FORMASPAGAMENTO')[0]
                       );
            },

            hideBaixar: function(get) {
                return get('isBaixado')   ||
                       !get('usuariosBaixaPrudenaco') ||
                       !get('isPedido')   || 
                       get('isCancelado') || 
                       get('isFaturado');
            },            

            hideImportar: function (get) {
                if(get('isNotaEntrada')){
                    return get('readOnly');
                } else {
                    return  get('readOnly')       || 
                            get('isPedidoCompra') ||
                            (
                                parseInt(get('model.MOVIMENTOS_NUMERO')) > 0 &&
                                !get('isNota')
                            ) || 
                            parseInt(get('model.MOVIMENTOS_ID_PESSOAS')) > 0 ||
                            (
                                get('hideDeOrcamento')  &&
                                get('hideDeRequisicao') &&
                                get('hideDePedido')     &&
                                get('hideDeOrdemServico')
                            );
                }
            },
            
            hideDeOrcamento: function(get) {
                return this.checkImportacao('ORC', 'Orçamentos');
            },

            hideDeOrdemServico: function(get) {
                return !get('isNotaEletronica') || configs.getClientName() != 'turbotec';
            },            

            hideDeRequisicao: function(get) {
                return this.checkImportacao('REQ', 'Requisições');
            },
            
            hideDePedido: function(get) {
                return (this.checkImportacao('PED', 'Pedidos') || (configs.getMovimentos().exportarGravado && !configs.getClientName().match(/prudenaco|casanova|bellar/)));
            },

            hideDePedidoCompra: function(get) {
                return this.checkImportacao('CPA', 'Pedidos Compra');
            },

            hideDeNotaConsumidor: function(get) {
                return this.checkImportacao('NFC', 'Notas Consumidor');
            },

            hideDeXML: function(get) {
                get('isNotaEntrada'); // force
                return !get('isNotaEntrada');
            },

            hideVincular: function(get) {
                return get('updating')    || 
                       !configs.getMovimentos().pedidoCompraObrigatorio ||
                       !get('isNotaEntrada') || 
                        get('isManifestar')   || 
                        get('isFaturado')
            },

            hideEmitir: function(get) {
                return get('updating') || 
                       !(configs.getClientName() == 'hospitalar' && (get('isPedido') || get('isOrcamento')) || 
                         configs.getClientName() == 'casanova' && (get('isPedido') || get('isOrcamento')) || 
                         configs.getClientName() == 'prudenmoveis' && (get('isPedido') || get('isTransferencia')))
            },

            hideIdPessoa: function(get) {
                return (configs.getClientName() != 'hospitalar' &&
                        configs.getClientName() != 'turbotec' &&
                        configs.getClientName() != 'santana')
            },

            hideCliente: function(get) {
                return get('updating')    || 
                       configs.getClientName() != 'hospitalar'
            },

            hideComboDocumentos: function(get) {
                return !get('isOrcamento') ||
                       !configs.getMovimentos().comboDocumentos;
            },

            hideConferencia: function(get) {
                return get('updating')    || 
                       !(configs.getClientName() == 'hospitalar' && (get('isPedido') || get('isOrcamento')) ||
                         configs.getClientName() == 'prudenmoveis' && get('isTransferencia'))
            },

            hideAbastecimento: function(get) {
                return get('updating')    || 
                       !(configs.getClientName() == 'prudenmoveis' && get('isTransferencia'))
            },

            hidePedido: function(get) {
                return get('updating')    || 
                       configs.getClientName() != 'prudenmoveis' ||
                       !get('isPedido')
            },

            hideComprovante: function(get) {
                return get('updating')    || 
                       configs.getClientName() != 'prudenmoveis' ||
                       !get('isPedido');
            },

            hideMeiaFolha: function(get) {
                return get('updating')    || 
                       configs.getClientName() != 'casanova' ||
                       !(get('isPedido') || get('isOrcamento'));
            },

            hideFolhaInteira: function(get) {
                return get('updating')    || 
                       configs.getClientName() != 'casanova' ||
                       !(get('isPedido') || get('isOrcamento'));
            },

            hideRomaneioEntrega: function(get) {
                return get('updating')    || 
                       configs.getClientName() != 'prudenmoveis' ||
                       !get('isPedido') 
            },

            hideTransferirParaCD: function(get) {
                return get('updating')    || 
                       (configs.getEmpresa().cnpj.substring(0, 8) != '04395395' && 
                        configs.getEmpresa().cnpj.substring(0, 8) != '45118377') ||
                       parseInt(get('model.MOVIMENTOS_NUMEROORIGEM')) == 0 ||
                       (!(get('isNotaEntrada') && get('isTransferir')) && 
                       !(get('isRequisicaoEntrada') && get('isAberto')));
            },

            hideColocarEmSeparacao: function(get) {
                return get('updating')    || 
                       configs.getClientName() != 'hospitalar' ||
                       get('isConsultaKardex') ||
                       !get('isPedido') ||
                       (get('model.MOVIMENTOS_STATUS') != 'M' && 
                        get('model.MOVIMENTOS_STATUS') != 'N')
            },

            hideColocarEmConferencia: function(get) {
                return get('updating')    || 
                       configs.getClientName() != 'hospitalar' ||
                       !get('isPedido') ||
                       get('model.MOVIMENTOS_STATUS') != 'S'
            },            

            hideExportar: function (get) {
                //force
                get('hideParaPedidoCompra');

                return get('updating')    || 
                       get('isEmUso')     ||
                       get('isReprovado') || 
                       get('isPedidoAberto') ||
                       get('isCancelado') ||
                       get('isDenegado')  || 
                       (
                           get('hideParaPedido')           &&
                           get('hideParaDevolucao')        &&
                           get('hideParaRequisicao')       &&
                           get('hideParaNotaEletronica')   &&
                           get('hideParaRomaneioEntrega')  &&
                           get('hideParaRomaneioMontagem') &&
                           get('hideParaRomaneioClienteRetirou')  &&
                           get('hideParaRomaneioEntregueOrcamento') &&
                           get('hideParaPedidoCompra')
                       ) || 
                       (
                           get('isTransferencia') &&
                           !get('isFaturado') &&
                           !get('isNotaEmitida')
                       ) 
            },
            
            hideParaPedido: function(get) {
                return this.checkExportacao('PED', 'Pedidos') || 
                    (
                        get('isOrcamento') &&
                        get('model.MOVIMENTOS_SERIEORIGEM') == 'PV' &&
                        get('model.MOVIMENTOS_FORMASPAGAMENTO')      &&
                        get('model.MOVIMENTOS_FORMASPAGAMENTO')[0]
                    )
            },

            hideParaPedidoCompra: function(get) {
                return this.checkExportacao('CPA', 'Pedidos Compra') || 
                    (
                        get('isSolicitacaoCompra') &&
                        get('model.MOVIMENTOS_SERIEORIGEM') == 'CP'
                    )
            },

            hideParaDevolucao: function(get) {
                return this.checkExportacao('DEV', 'Devoluções');
            },
            
            hideParaNotaEletronica: function(get) {
                //force
                get('hideParaPedidoCompra');

                const emissao = momentTz(Ext.$('formmovimentos')[0].model.get('MOVIMENTOS_EMISSAO')).hours(0).minutes(0).seconds(0);
                const maxDate = momentServer().subtract(1, 'years').hours(0).minutes(0).seconds(0);
                const podeExportar = momentTz(emissao.format()).isSameOrAfter(maxDate);

                return this.checkExportacao('NFE', 'Nota Eletrônica') ||
                       (get('isPedido')     && get('model.MOVIMENTOS_SERIEORIGEM').match(/NE|NC/)) ||
                       (get('isPreVendaST') && get('model.MOVIMENTOS_SERIEORIGEM').match(/NE|NC/)) ||
                       (podeExportar == false);
            },

            hideParaNotaConsumidor: function(get){

                const semPermissao = !SamosUtils.Security.temPermissaoModulo('Movimentos', 'Nota Consumidor', 'create');
                const pessoaCNPJ   = (SamosUtils.String.onlyNumbers(get('model.MOVIMENTOS_CPFCNPJ')) || '').trim().length > 11;
                const jaExportado  = get('model.MOVIMENTOS_SERIEORIGEM').match(/NC|NE/);

                return semPermissao || pessoaCNPJ || jaExportado;
            },

            hideParaOrdemServico: function(get){
                //Usei isso pra concatenar com o nome do modulo na hora e checar a parmissão, pois alguns clientes usam modulos separados
                const abreviacaoCliente = configs.getClientName() == 'acomtf' ? ' MTF' : '';
                         
                if(configs.getMovimentos().ramoRomaneio == 'moveis') {  // Móveis só usa OS de Móveis
                    return true;
                }
                                                                        
                //Esconde se ele não tem permissao pra acessar o modulo
                return !SamosUtils.Security.temPermissaoModulo('Movimentos', 'Ordem Serviço'+abreviacaoCliente, 'create');
            },

            hideParaRequisicao: function(get) {
                return this.checkExportacao('REQ', 'Requisições');
            },
            
            hideParaRomaneioEntrega: function(get) {
                //force
                get('hideParaPedidoCompra');

                return this.checkExportacao('ENT', 'Romaneio Entrega');
            },

            hideParaRomaneioClienteRetirou: function(get) {
                //force
                get('hideParaPedidoCompra');

                return this.checkExportacao('ENT', 'Romaneio Entrega') || 
                       configs.getClientName() != 'stilomoveis';
            },            

            hideParaRomaneioEntregueOrcamento: function(get) {
                //force
                get('hideParaPedidoCompra');

                return this.checkExportacao('ENT', 'Romaneio Entrega') || 
                       configs.getClientName() != 'stilomoveis';
            },                        

            hideParaRomaneioMontagem: function(get) {
                //force
                get('hideParaPedidoCompra');

                return this.checkExportacao('MON', 'Romaneio Montagem');
            },

            hideImprimir: function (get) {
                return get('isEmUso')     ||
                       get('updating')    || 
                       get('isReprovado') || 
                       get('isCancelado') || 
                       get('isDenegado')  || 
                       !get('hideFolhaInteira') ||
                       (get('isNota') && !get('isNotaEntrada') && !get('isNotaSantana')) ||
                       (get('isPedido') && get('isAberto') && !get('isPedidoHospitalar')) ||
                       (get('isDevolucao') && get('isAberto'));
            },

            disableImprimir: function(get) {
                return get('isPedidoImpresso');
            },

            hideOpcoes: function (get) {
                return get('isEmUso')  ||
                       get('isNotaEntrada') ||
                       get('isConsultaKardex') ||
                       (
                            get('hideTransporte')   &&
                            get('hideEnviarEmail')  &&
                            get('hideGerarLinkPDF')    &&
                            get('hideCancelamento') &&
                            get('hideEntregaMontagem') &&
                            get('hideReativar')     &&
                            get('hideAprovado')     &&
                            get('hidePendente')     &&
                            get('hideReprovado')    &&
                            get('hideTransferir')   && 
                            get('hideRecepcao')     && 
                            get('hideAlterarEmissao')
                       );
            },

            hideCaixa: function (get) {
                return get('isEmUso') ||
                       get('isConsultaKardex') || 
                       get('financeiroNulo') ||
                       (!get('receberObrigatorio') && !get('isPedido') && !get('isOrcamento') & !get('isNotaEletronica')) ||
                       (!get('formasDePagamento') && get('isOrcamento')) ||                        
                       (get('isVendedor') && (get('isFaturado') || configs.getEmpresa().regimeCaixa) && configs.getClientName() != 'prudenmoveis' && !get('isOrcamento')) ||
                       get('isRequisicaoEntrada') ||                        
                       get('updating')      || 
                       (get('isPedido') && get('isReprovado')) ||
                       get('isNotaEntrada') ||
                       get('isDenegado')    || 
                       get('isReprovado')   || 
                       get('isCancelado');
            },

            hidePagamento: function (get) {
                return  get('isEmUso')  ||
                        get('updating') || 
                        get('financeiroNulo') ||
                        get('isConsultaKardex') ||
                        !get('pagarObrigatorio') ||
                        (
                            !get('isNotaEntrada') &&
                            !get('isRequisicaoEntrada')
                        );
            },

            hideEfetivar: function (get) {
                return !get('isDevolucao') ||
                       get('isFaturado') ||
                       get('isVendedor') || 
                       get('updating') || 
                       get('isDenegado') || 
                       get('isCancelado');
            },

            hideLiberar: function (get) {
                return !get('isEmUso') || get('isNotaEntrada');
            },

            hideMarkup: function(get) {
                if(configs.getMovimentos().usarMarkup) {
                    return (
                        !configs.getUsuario().privilegiado || 
                        (
                            configs.getUsuario().privilegiado && 
                            !get('markupAtivo')
                        )
                    )
                } else {
                    return true;
                }
            },

            hideCusto: function(get) {
                if(configs.getClientName() == 'pinguim') {
                    return (
                        !configs.getUsuario().privilegiado || 
                        (
                            configs.getUsuario().privilegiado && 
                            !get('custoAtivo')
                        )
                    )
                } else {
                    return true;
                }
            },

            hideSaldo: function(get) {
                return !configs.getMovimentos().gridProdutos['SALDOS_DISPONIVEL'] || (!get('updating') && configs.getClientName() != 'bellar');
            },
            
            isSistemaAprovacao: function(get){
                return configs.getMovimentos().sistemaDeAprovacao;
            },

            isSimplesNacional: function(get){
                return (get('model.EMPRESAS_SIMPLES') || '').match(/0|T/);
            },

            hidePendente: function (get) {
                return !get('isPedido')           ||
                        get('updating')           ||
                        get('isFaturado')         || 
                       !get('isSistemaAprovacao') || 
                       !get('isSupervisor')       || 
                        get('isPendente')         || 
                        get('isCancelado')
            },

            hideAprovado: function (get) {
                return !get('isPedido')           ||
                        get('updating')           ||
                       !get('isSistemaAprovacao') || 
                        get('isVendedor')         ||
                        get('isAprovado')         || 
                        get('isCancelado')
            },

            hideReprovado: function (get) {
                return  !get('isPedido')           ||
                         get('updating')           ||
                         get('isFaturado')         || 
                        !get('isSistemaAprovacao') || 
                        !get('isSupervisor')       || 
                         get('isReprovado')        || 
                         get('isCancelado');
            },

            hidePropriedade: function(get){
                return !get('model.MOVIMENTOS_ID_PROPRIEDADES');
            },

            isPendente: function(get) {
                return get('isSistemaAprovacao') && get('model.MOVIMENTOS_SITUACAO') == 'P';
            },

            isEntradaCustoNulo : function(get) {
                return (get('isNotaEntrada') || get('isRequisicaoEntrada')) && (get('model.MOVIMENTOS_SITUACAO') == '1' || get('model.MOVIMENTOS_SITUACAO') == '3');
            },

            isNotaLislais : function(get) {
                return (get('isNotaEletronica') && configs.getClientName() == 'lislais');
            },

            isNotaOzoniobras : function(get) {
                return (get('isNotaEletronica') && configs.getClientName() == 'ozoniobras');
            },

            isAprovado: function(get) {
                return get('isSistemaAprovacao') && get('model.MOVIMENTOS_SITUACAO') == 'A';
            },

            isReprovado: function(get) {
                return get('isSistemaAprovacao') && get('model.MOVIMENTOS_SITUACAO') == 'R';
            },

            isPedidoHospitalar: function(get) {
                return (configs.getClientName() == 'hospitalar' &&
                        get('isPedido'));
            },

            isPedOrcPrudenmoveis: function(get) {
                return (configs.getClientName() == 'prudenmoveis' &&
                        (get('isPedido') || get('isOrcamento')));
            },
           
            isPedOrcStilo: function(get) {
                return (configs.getClientName() == 'stilomoveis' &&
                        (get('isPedido') || get('isOrcamento')));
            },

            isSaidaRacaforte: function(get) {
                return (configs.getClientName() == 'racaforte' &&
                        (get('isPedido') || get('isOrcamento') || get('isNotaEletronica')));
            },

            isPedidoRacaforte: function(get) {
                return (configs.getClientName() == 'racaforte' &&
                        get('isPedido'));
            },

            isNotaRacaforte: function(get) {
                return (configs.getClientName() == 'racaforte' &&
                        get('isNotaEletronica'));
            },

            isVendedorPinguim: function(get) {
                return (configs.getClientName() == 'pinguim' &&
                        get('isPedido') &&
                        configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor);
            },

            isHerbiquimica: function(get) {
                return configs.getClientName() == 'herbiquimica'
            },

            isHospitalar: function(get) {
                return configs.getClientName() == 'hospitalar'
            },

            isTurbotec: function(get) {
                return configs.getClientName() == 'turbotec'
            },

            isClientPrazo: function(get) {
                return configs.getMovimentos().exibirCondicao
            },

            isPedidoAberto: function(get) {
                return (configs.getClientName() == 'hospitalar' &&
                        get('isPedido') && 
                        get('model.MOVIMENTOS_STATUS') != 'I') ;
            },

            isPedidoEmProcessamento: function(get) {
                return (configs.getClientName() == 'hospitalar' &&
                        get('isPedido') && 
                        (  get('model.MOVIMENTOS_STATUS') == 'S' || 
                           get('model.MOVIMENTOS_STATUS') == 'P' || 
                            get('model.MOVIMENTOS_STATUS') == 'I'))
            },

            isOperacaoSaida: function(get) {
                return get('model.OPERACOES_TIPO') == 'S';
            },

            finalidadeNormal: function(get){
                return get('model.OPERACOES_FINALIDADE') == 'N';
            },

            formasDePagamento: function(get){
                return get('model.OPERACOES_FINANCEIRO') == 'O';
            },

            financeiroNulo: function(get){
                return get('model.OPERACOES_FINANCEIRO') == 'N';
            },

            receberObrigatorio: function(get){
                return get('model.OPERACOES_FINANCEIRO') == 'R';
            },

            pagarObrigatorio: function(get){
                return ((get('model.OPERACOES_FINANCEIRO') == 'P' || (get('isRequisicao') && get('model.OPERACOES_FINANCEIRO') != 'N')) && get('model.MOVIMENTOS_SITUACAO') < 2);
            },

            cartoesObrigatorio: function(get) {
                return get('model.DOCUMENTOS_COLETACARTAO') == 'T';
            },

            transporteObrigatorio: function(get) {
                return get('model.DOCUMENTOS_COLETATRANSPORTE') == 'T';
            },

            entregaObrigatoria: function(get) {
                return get('model.DOCUMENTOS_COLETAENTREGA') == 'T';
            },

            outroObrigatorio: function(get) {
                return get('model.DOCUMENTOS_COLETAOUTRO') == 'T';
            },

            temPropriedade: function(get) {
                return configs.getPessoas().propriedades &&
                        get('model.MOVIMENTOS_ID_PROPRIEDADES') > 0 ;
            },            

            hideTransporte: function (get) {
                return !get('transporteObrigatorio') || 
                       (get('updating') && !get('editionClosed')) || 
                       get('isDenegado') || 
                       get('isReprovado') || 
                       get('isCancelado');
            },
            
            hideDocsVinculados: function (get) {
                return !get('isNotaEletronica') || 
                       (get('updating') && !get('editionClosed')) || 
                       get('isDenegado') || 
                       get('isCancelado');
            },

            hideDadosImportacao: function (get) {
                return !get('isNotaEletronica') || 
                       !get('isNotaImportacao') ||
                       (get('updating') && !get('editionClosed')) || 
                       get('isDenegado') || 
                       get('isCancelado');
            },


            hideEntregaMontagem: function (get) {
                return configs.getClientName() == 'hospitalar' || 
                      (get('updating') && !get('editionClosed')) || 
                       get('isTransferencia') || 
                       get('isNotaEletronica') || 
                       get('isPedidoCompra') || 
                       get('isSolicitacaoCompra') ||                        
                       get('isDenegado') || 
                       get('isReprovado') || 
                       get('isCancelado');
            },

            hideConferir: function (get) {
                return !configs.getMovimentos().conferenciaItensPedido ||
                       get('updating') || 
                       !get('isPedido') || 
                       get('model.MOVIMENTOS_STATUS') != 'P' ||
                       get('model.MOVIMENTOS_SITUACAO') != '0';
            },

            hideReserva: function (get) {
                return (get('updating') && !get('editionClosed')) || 
                       configs.getMovimentos().ramoRomaneio != 'moveis' ||
                       !get('isPedido') || 
                       get('isReprovado') || 
                       get('isCancelado');
            },

            hideCasco: function (get) {
                return (get('updating') && !get('editionClosed')) || 
                       configs.getClientName() != 'turbotec' ||
                       !(get('isPedido') || get('isNotaEletronica')) ||
                       get('isCancelado');
            },

            hidePartidas: function (get) {
                return (get('updating') && !get('editionClosed')) || 
                      configs.getClientName() != 'racaforte' ||
                      !(get('isNotaEletronica') || get('isPedido'))
            },

            hideRomaneio: function (get) {
                return !get('isPedido') || 
                      configs.getClientName() != 'stilomoveis' ||
                      configs.getUsuario().id > 2;                      
            },

            hideSefaz: function (get) {
                return get('updating') || !get('isNotaEletronica');
            },

            hideManifesto: function(get) {
                return get('updating') || 
                    !get('isNotaEntrada') || (
                        get('isNotaEntrada') && !get('isManifestar')
                    );
            },

            hideEnviarEmail: function (get) {
                return get('updating')        || 
                       get('isDenegado')      || 
                       get('isReprovado')     || 
                       get('isCancelado')     || 
                       get('isTransferencia') ||
                       get('isNota')          ||
                       (get('isVendedor') && configs.getClientName() == 'prudenmoveis');
            },

            hideGerarLinkPDF: function (get) {
                return get('updating')        || 
                       get('isDenegado')      || 
                       get('isReprovado')     || 
                       get('isCancelado')     || 
                       get('isTransferencia') ||
                       get('isNota')          ||
                       get('isPedidoCompra')  ||
                       (get('isVendedor') && configs.getClientName() == 'prudenmoveis');
            },
            
            hideTransferir: function(get) {
                return get('updating')         || 
                       get('isFaturado')       || 
                       get('isCancelado')      || 
                      !get('isAbastecimento')  ||
                       !get('isTransferencia');
            },
            
            hideCancelamento: function(get) {
                return get('updating')    || 
                       get('isReprovado') || 
                       get('isCancelado') || 
                       get('isNota') ||
                       get('isTransferencia') ||
                       ( get('isVendedor') && configs.getClientName() == 'prudenmoveis') || 
                       (
                           get('isOrcamento') &&
                           get('model.MOVIMENTOS_SERIEORIGEM') == 'PV' &&
                           get('model.MOVIMENTOS_FORMASPAGAMENTO')      &&
                           get('model.MOVIMENTOS_FORMASPAGAMENTO')[0]
                       );
            },

            hideReativar: function(get) {
                return  get('updating')        ||
                        !get('isSupervisor')   ||                    
                        (
                            !get('isCancelado') && 
                            !get('isFaturado') &&
                            !get('isPedidoEmProcessamento')
                        )                      ||
                        get('isNota')          ||
                        get('isReprovado')     ||
                        get('isTransferencia') || 
                        (
                            get('isOrcamento') &&
                            get('model.MOVIMENTOS_SERIEORIGEM') == 'PED'
                        );
            },

            hideRecepcao: function(get) {
                return !get('readOnly') ||
                      !get('isPedidoCompra') ||
                       get('model.MOVIMENTOS_SITUACAO') == 'R';
            },

            hideAlterarEmissao: function(get) {
                return !get('readOnly')      ||
                        get('isNotaEntrada') || 
                        get('isVendedor')    ||                         
                        get('isRequisicaoEntrada') ||
                        get('model.MOVIMENTOS_STATUS') != 'N'
            },

            hideAlterarVendedor: function(get) {
                return !get('readOnly')      ||
                        get('isNotaEntrada') || 
                        get('isVendedor') ||                         
                        get('isRequisicaoEntrada')
            },

            hideGerarPDFs: function(get) {
                //force
                get('isOrcamento');
                
                return !get('readOnly')      ||
                       !get('isNotaEletronica') || 
                       !get('isFaturado') || 
                       !configs.getMovimentos().redisNfeBoletos
            },

            hideAjusteDataPDF: function(get) {
                //force
                get('isOrcamento');
                
                return !get('isPedido') || 
                       configs.getClientName() != 'stilomoveis' ||  // Supervisor/Ricardo Somente
                       configs.getUsuario().id > 2;
            },

            hideParciais: function(get) {
                return !get('readOnly') ||
                       !get('isPedido') ||
                       configs.getClientName() != 'prudenaco' ||
                       !get('usuariosBaixaPrudenaco') ||
                       get('isFaturado') ||
                       get('isBaixado') ||
                       get('isCancelado'); 
            },

            hideProdutos: function (get) {
                return get('readOnly') || !get('isPedidoCompra');
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
                return get('model.MOVIMENTOS_STATUS') == 'C';
            },

            isDenegado: function(get) {
                return get('model.MOVIMENTOS_STATUS') == 'D';
            },

            isRecusado: function(get) {
                return get('model.MOVIMENTOS_STATUS') == 'R';
            },

            isDevolvido: function(get) {
                return get('model.MOVIMENTOS_STATUS') == 'V';
            },

            isFaturado: function(get) {
                return get('model.MOVIMENTOS_STATUS') == 'F';
            },

            isBaixado: function(get) {
                return get('model.MOVIMENTOS_STATUS') == 'X' ||
                       get('model.MOVIMENTOS_STATUS') == 'Z';
            },

            usuariosBaixaPrudenaco: function(get) {
                return configs.getClientName() == 'prudenaco' &&
                (configs.getMovimentos()['baixarPedidos'] || []).includes( configs.getPermissao()['USUARIOS_ID'] || '' )
            },

            isNotaEmitida: function(get) {
                return get('model.MOVIMENTOS_STATUS') == 'A' ||
                       ((get('model.MOVIMENTOS_ID_DOCUMENTOS') || '').toString().slice(-4) == '0003' &&
                        get('model.MOVIMENTOS_PROTOCOLO') != '');
            },

            isAberto: function(get) {
                return get('model.MOVIMENTOS_STATUS') == 'N' && 
                       get('model.OPERACOES_FINANCEIRO') != 'N';
            },

            isManifestar: function(get) {
                return get('model.MOVIMENTOS_STATUS') == 'G';
            },

            isTransferir: function(get) {
                return get('model.MOVIMENTOS_STATUS') == 'H';
            },

            isComplementar: function(get){
                return get('model.OPERACOES_COMPLEMENTAR') == 'T';
            },

            isAjuste: function(get){
                return get('model.OPERACOES_FINALIDADE') == 'A';
            },

            isFinalidadeEspecial: function(get){
                return get('model.OPERACOES_FINALIDADE') != 'N';
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

            isTransferencia: function(get) {
               return get('listName').match(/Transferência/);
            },

            isTransfEntrada: function(get) {
                return (
                    get('listName').match(/Transferência/) && 
                    (
                        get('model.MOVIMENTOS_ID_OPERACOES') == 800000 || 
                        get('model.MOVIMENTOS_ID_OPERACOES') == 710000
                    )
                );
            },

            isTransfSaida: function(get) {
                return (
                    get('listName').match(/Transferência/) && 
                    get('model.MOVIMENTOS_ID_OPERACOES') == 700000
                );
            },

            isAbastecimento: function(get) {
                return (
                    get('listName').match(/Transferência/) && 
                    get('model.MOVIMENTOS_ID_OPERACOES') == 710000 && 
                    get('model.MOVIMENTOS_ID_PESSOAS') == configs.getEmpresa().id
                );
            },

            isNota: function(get) {
                return get('isNotaEntrada') || get('isNotaEletronica');
            },

            isNotaSantana: function(get) {
                return configs.getClientName() == 'santana' && get('isNotaEletronica');
            },

            isNotaEletronicaMTF: function(get) {
                return configs.getClientName() == 'acomtf' && get('isNotaEletronica');
            },

            isOrcamentoRaca: function(get) {
                return configs.getClientName() == 'racaforte' && get('isOrcamento');
            },

            isPedidoMalacrida: function(get) {
                return configs.getClientName() == 'malacrida' && get('isPedido');
            },

            isNotaEletronicaHerbiquimica: function(get) {
                return configs.getClientName() == 'herbiquimica' && get('isNotaEletronica');
            },

            isNotaEntrada: function(get) {
                return !!get('listName').match(/Entrada/);
            },

            isNotaComRequisicao: function(get) {
                return get('listName').match(/Entrada/) &&  configs.getMovimentos().exibirRequisicaoNfe;
            },

            isNotaComPedidoCompra: function(get) {
                return get('isNotaEntrada') &&  configs.getMovimentos().pedidoCompraObrigatorio;
            },

            isSemChaveNfe: function(get) {
                return (
                    get('isNotaEntrada') &&
                    get('model.MOVIMENTOS_NFE').trim() == ''
                );
            },

            colorTheme: function(get) {
                return configs.getTema() ? 'color:' + configs.getTema() :'color:blue';
            },

            marcaDaguaStyle: function(get) {
                let color;
                let text;

                if(get('isCancelado')) {
                    text  = 'Cancelado';
                    color = 'rgb(255,0,0,0.3)';
                } else if(get('isReprovado')) {
                    text  = 'Reprovado';
                    color = 'rgb(255,0,0,0.3)';
                } else if(get('isDenegado')) {
                    text  = 'Denegada';
                    color = 'rgb(255,0,0,0.3)';
                } else if(get('isRecusado')) {
                    text  = 'Recusada';
                    color = 'rgb(255,0,0,0.3)';
                } else if(get('isDevolvido')) {
                    text  = 'Devolvida';
                    color = 'rgb(255,0,0,0.3)';
                } else if(get('isEmUso')) {
                    text  = 'Em Uso';
                    color = 'rgb(255,0,0,0.3)';
                } else if(get('isNotaEletronica')) {
                    text  = 'Nota Eletrônica';
                    color = 'rgb(0,0,0,0.3)';
                } else if(get('isNotaEntrada')) {
                    text  = 'Nota Entrada';
                    color = 'rgb(0,0,0,0.3)';
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

            isNotaEletronica: function(get) {
                return !!get('listName').match(/Nota Eletr/);
            },

            isNotaImportacao: function(get) {
                return !!get('listName').match(/Nota Eletr/) && get('model.OPERACOES_ACAO') == 'IM';
            },

            hasProtocolo: function(get) {
                return !!get('model.MOVIMENTOS_PROTOCOLO');
            },

            hasPropriedade: function(get) {
                return get('model.MOVIMENTOS_ID_PROPRIEDADES') > 0;
            },

            isCentroDistribuicao: function(get){
                return configs.getEmpresa().id == 1;
            },

            isMovtoCentroCusto: function(get){
                return configs.getFinanceiros().centrocusto && get('isNotaEntrada');
            },

            isMovtoCentroCustoRaca: function(get){
                return configs.getFinanceiros().centrocusto && 
                (get('isNotaEntrada') || get('isNotaEletronica')) && configs.getClientName() == 'racaforte';
            },

            isDevolucao: function(get) {
                return get('listName').match(/Devolu/);
            },

            isDevolucaoMoveis: function(get) {
                return get('listName').match(/Devolu/) && configs.getClientName().match(/moveis/);
            },

            isPedido: function(get) {
                return get('listName').match(/Pedido/) && !get('listName').match(/Compra/);
            },

            isPedidoST: function(get) {
                return get('listName').match(/Pedido/) && 
                       get('model.OPERACOES_ST') == 'T';                      
            },

            isPreVenda: function(get) {
                return get('listName').match(/-venda/);
            },

            isPreVendaST: function(get) {
                return get('listName').match(/-venda/) &&
                       get('model.OPERACOES_ST') == 'T';                      
            },

            isNotaEletronicaST: function(get) {
                return get('listName').match(/Nota Eletr/) && 
                       get('model.OPERACOES_ST') == 'T';                      
            },

            isPedidoImpresso: function(get) {
                return ((get('listName').match(/Pedido/) && !get('listName').match(/Compra/)) || 
                         get('listName').match(/Orçamento/)) &&
                      configs.getMovimentos().disableImpressao &&
                      !get('isSupervisor') &&
                       get('model.MOVIMENTOS_PROTOCOLO')
            },

            isPedidoLislais: function(get) {
                return get('listName').match(/Pedido/) && !get('listName').match(/Compra/) && configs.getClientName() == 'lislais';
            },

            isOrcamento: function(get) {
                return get('listName').match(/Orçamento/);
            },

            isOrcamentoRacaforte: function(get) {
                return (get('listName').match(/Orçamento/) && configs.getClientName() == 'racaforte');
            },

            isOrcamentoPrazo: function(get) {
                return (get('listName').match(/Orçamento/) && configs.getMovimentos().prazosOrcamento);
            },

            isPreVendaPrazo: function(get) {
                return (get('listName').match(/Pré-vendas/) && configs.getMovimentos().prazosOrcamento);
            },

            isOrcamentoPinguim: function(get) {
                return get('listName').match(/Orçamento/) && configs.getClientName() == 'pinguim';
            },

            isPedidoCompra: function(get) {                
                return get('listName').match(/Pedido/) && get('listName').match(/Compra/) || false;
            },

            isSolicitacaoCompra: function(get) {
                return get('listName').match(/Solicita/) && get('listName').match(/Compra/);
            },

            isPedidoCompraMoveis: function(get) {
                return get('listName').match(/Pedido/) && get('listName').match(/Compra/) && configs.getClientName().match(/moveis/);
            },            

            isNotaProducao: function(get) {
                return get('isNotaEletronica') &&
                       (configs.getClientName() == 'biomart' || 
                        configs.getClientName() == 'herbiquimica' || 
                        configs.getClientName() == 'malacrida' ||
                        configs.getClientName() == 'organoplant');
            },

            isPedidoLote: function(get) {
                return get('listName').match(/Pedido/) &&
                       !get('listName').match(/Compra/) &&
                       configs.getMovimentos().lancarLoteNoPedido;
            },

            isRequisicaoLote: function(get) {
                return get('listName').match(/Requi/) &&
                       configs.getMovimentos().lancarLoteNaRequisicao;
            },            
            
            isRequisicao: function(get) {
                return get('listName').match(/Requi/);
            },

            isRequisicaoEntrada: function(get) {
                return (
                    !!get('listName').match(/Requi/) && 
                    (
                        get('model.MOVIMENTOS_ID_OPERACOES') < 500000 ||
                        configs.getClientName() == 'hermes'
                    )
                );
            },

            isMovimentoInterno: function(get) {
                return (get('model.PESSOAS_CPFCNPJ') || '').toString().slice(0, 8) == (configs.getEmpresa().cnpj || '').toString().slice(0, 8)
            },

            isMovimentoStiloMoveis: function(get) {
                return configs.getClientName() == 'stilomoveis' && !get('isNotaEletronica')
            },

            isOrcPedStilo: function(get) {
                return configs.getClientName() == 'stilomoveis' && (get('isPedido') || get('isOrcamento'));
            },


            temNumeroOrigem: function(get) {
                return (
                    get('model.MOVIMENTOS_NUMEROORIGEM') > 0
                );
            },

            isRequisicaoEditavel: function(get) {
                return (
                    get('isRequisicaoEntrada') && 
                    configs.getMovimentos().editaNumeroRequisicao
                );
            },

            readOnlyVendedor: function(get) {
                get('isPedido'); // force
                return !configs.getMovimentos().editaVendedor;
            },

            readOnlyTipoUsuario: function(get) {
                get('isPedido'); // force
                return configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor && 
                       configs.getClientName() != 'pinguim';
            },

            permitidoVendaConsumidor: function(get) {
                return get('model.DOCUMENTOS_ID_PESSOAS') > 0 && !get('isNota');
            },

            permitidoAlterarPreco: function(get) {
                return  get('model.DOCUMENTOS_ALTERAPRECO') == 'T' || 
                        get('isNotaEntrada');
            },

            uiDescontoItem: function(get) {
                return get('isDescontoPorItem') ? ('textbold-' + configs.getTema()): 'field-readonly';
            },

            readOnlyTotalLiquido: function(get){
                return !configs.getMovimentos().alteraLiquido || get('isNotaEntrada');
            },

            valorPesoBruto: function(get) {
                get('forcePesoBruto');
                const transporte = get('model.MOVIMENTOS_ENVIO');
                return transporte && transporte[0] ? transporte[0]['MOVIMENTOSENVIO_PESOBRUTO'] : 0;
            },

            informaPedido: function(get) {
                return configs.getMovimentos().exibirPedidoCompraNfe;
            },

            nickName: function(get) {
                const nickName = get('model.USUARIOS_LOGIN') || '';
                return nickName.split(' ')[0];
            },            
            
            isConsumidorPrudenMoveis: function(get) {                
                return configs.getClientName() == 'prudenmoveis' && (get('model.DOCUMENTOS_ID_PESSOAS') == get('model.MOVIMENTOS_ID_PESSOAS'));
            },            

            pessoaAssociations: function(get) {
                const usarPropriedade = configs.getPessoas().propriedades && get('temPropriedade');

                return get('listName') != "Transferências" ? 
                    [
                        ['MOVIMENTOS_NOME',       (usarPropriedade ? 'PROPRIEDADES_NOME' : 'PESSOAS_NOME')],
                        ['MOVIMENTOS_ID_PESSOAS', 'PESSOAS_ID'],
                        ['PESSOAS_ID',            'PESSOAS_ID'],
                        ['PESSOAS_NOME',          'PESSOAS_NOME'],
                        ['MOVIMENTOS_CPFCNPJ',    (usarPropriedade ? 'PROPRIEDADES_CPFCNPJ' : 'PESSOAS_CPFCNPJ')],
                        ['PESSOAS_CPFCNPJ',       'PESSOAS_CPFCNPJ'],                        
                        ['CIDADES_NOME',          (usarPropriedade ? 'CIDADES_NOMEPROPRIEDADE' : 'CIDADES_NOME')],
                        ['CIDADES_ESTADO',        (usarPropriedade ? 'CIDADES_ESTADOPROPRIEDADE' : 'CIDADES_ESTADO')],
                        ['PESSOAS_FANTASIA',      'PESSOAS_FANTASIA'],
                        ['MOVIMENTOS_EMAIL',      'PESSOAS_EMAIL'],
                        ['PESSOAS_EMAIL',         'PESSOAS_EMAIL'],
                        ['PESSOAS_TELEFONE',      'PESSOAS_TELEFONE'],
                        ['PESSOAS_PAGINA',        'PESSOAS_PAGINA'   ],
                        ['MOVIMENTOS_CELULAR',    'PESSOAS_CELULAR'],
                        ['PESSOAS_CELULAR',       'PESSOAS_CELULAR'],
                        ['PESSOAS_ENDERECO',      'PESSOAS_ENDERECO'],
                        ['PESSOAS_NUMERO',        'PESSOAS_NUMERO'],
                        ['PESSOAS_BAIRRO',        'PESSOAS_BAIRRO'],
                        ['PESSOAS_CEP',           'PESSOAS_CEP'],
                        ['PESSOAS_ID_CIDADES',    'PESSOAS_ID_CIDADES'],
                        ['PESSOAS_CREDITO',       'PESSOAS_CREDITO'],
                        ['PESSOAS_DESCONTO',      'PESSOAS_DESCONTO'],
                        ['PESSOAS_STATUS',        'PESSOAS_STATUS'],
                        ['PESSOAS_TIPO',          'PESSOAS_TIPO'],
                        ['PESSOAS_CATEGORIA',     'PESSOAS_CATEGORIA'],
                        ['PESSOAS_INSCRICAO',     'PESSOAS_INSCRICAO'],
                        ['PESSOAS_ID_USUARIOS',   'PESSOAS_ID_USUARIOS'],
                        ['USUARIOS_NOMEVENDEDOR', 'USUARIOS_NOMEVENDEDOR'],
                        ['MOVIMENTOS_ID_PROPRIEDADES', 'ID_PROPRIEDADE'],
                        ['PROPRIEDADES_CPFCNPJ',      'PROPRIEDADES_CPFCNPJ'],
                        ['PROPRIEDADES_ENDERECO',     'PROPRIEDADES_ENDERECO'],
                        ['PROPRIEDADES_NUMERO',       'PROPRIEDADES_NUMERO'],
                        ['PROPRIEDADES_BAIRRO',       'PROPRIEDADES_BAIRRO'],
                        ['PROPRIEDADES_CELULAR',       'PROPRIEDADES_CELULAR'],
                        ['PROPRIEDADES_CEP',          'PROPRIEDADES_CEP'],
                        ['CIDADES_NOMEPROPRIEDADE',   'CIDADES_NOMEPROPRIEDADE'],
                        ['CIDADES_ESTADOPROPRIEDADE', 'CIDADES_ESTADOPROPRIEDADE'],
                        ['XML_AUTOMATICO',            'XML_AUTOMATICO'],
                        ['VCTO_FIXO',                 'VCTO_FIXO'],
                        ['PARTIDA_NFE',               'PARTIDA_NFE'],
                        ['CLASSE_CADASTRO',           'CLASSE_CADASTRO'],
                        ['PESSOAS_OBSERVACOES',       'PESSOAS_OBSERVACOES'],
                        ['PESSOAS_LOG',               'PESSOAS_LOG']
                    ] : [
                        ['MOVIMENTOS_NOME',       'EMPRESAS_FANTASIA'],
                        ['MOVIMENTOS_ID_PESSOAS', 'EMPRESAS_ID'],
                        ['PESSOAS_ID',            'PESSOAS_ID'],
                        ['MOVIMENTOS_CPFCNPJ',    'EMPRESAS_CPFCNPJ'],
                        ['PESSOAS_CPFCNPJ',       'EMPRESAS_CPFCNPJ'],
                        ['PESSOAS_STATUS',        'EMPRESAS_STATUS'],
                        ['CIDADES_NOME',          'CIDADES_NOME'],
                        ['CIDADES_ESTADO',        'CIDADES_ESTADO'],
                        ['MOVIMENTOS_EMAIL',      'EMPRESAS_EMAIL'],
                        ['PESSOAS_TELEFONE',      'EMPRESAS_TELEFONE'],
                        ['PESSOAS_PAGINA',        'PESSOAS_PAGINA'   ],
                        ['MOVIMENTOS_CELULAR',     'EMPRESAS_CELULAR'],
                        ['PESSOAS_ENDERECO',      (usarPropriedade ? 'ENDERECO_PROPRIEDADE' : 'PESSOAS_ENDERECO')],
                        ['PESSOAS_NUMERO',        'EMPRESAS_NUMERO'],
                        ['PESSOAS_BAIRRO',        'EMPRESAS_BAIRRO'],
                        ['PESSOAS_CEP',           'EMPRESAS_CEP'],
                        ['PESSOAS_ID_USUARIOS',   'PESSOAS_ID_USUARIOS'],
                        ['PESSOAS_ID_CIDADES',    'EMPRESAS_ID_CIDADES']
                    ];
            },

            storeStatus: function(get) {
                const title = get('listName');

                if(configs.getClientName() == 'hospitalar' && get('isPedido')) {
                    return [
                        ['Q', 'Pendente'],
                        ['N', 'Não Faturado'],
                        ['M', 'Não Faturado'],
                        ['S', 'Em Separação'],
                        ['P', 'Em Conferência'],
                        ['I', 'Fechado'],
                        ['F', 'Faturado'],
                        ['E', 'Faturado'],
                        ['C', 'Cancelado'],
                        ['B', 'Cancelado']
                    ]

                } else {
                    return [
                        ['N', title == 'Nota Entrada'       ? 'Não Implementada' :
                              title == 'Transferências'     ? 'Abastecimento' : 
                              title == 'Solicitação Compra' ? 'Não Exportado' : 
                              'Não Faturado'],
                        ['M', title == 'Nota Entrada'   ? 'Não Implementada' : 
                              title == 'Transferências' ? 'Abastecimento' : 'Não Faturado'],
                        ['F', title == 'Nota Entrada'   ? 'Implementada' : 
                              title == 'Transferências' ? 'Transferida' : 
                              title == 'Solicitação Compra' ? 'Exportado' :
                              title == 'Pedidos Compra' ? 'Recebido' : 'Faturado'],
                        ['E', title == 'Nota Entrada' ? 'Implementada' : 
                              title == 'Transferências' ? 'Transferida' : 'Faturado'],
                        ['G', 'Manifestar'],
                        ['H', 'Transferir'],
                        ['A', 'Nota Emitida'],
                        ['C', 'Cancelado'],
                        ['B', 'Cancelado'],
                        ['D', 'Denegada'],
                        ['R', 'Recusada'],
                        ['U', 'Inutilizada'],
                        ['V', 'Devolvida'],
                        ['X', 'Baixado'],
                        ['Z', 'Baixado']
                    ]
                }
                
            }
        });
    },

    stores: {
        produtos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.movimento.ModelItens',
            autoLoad: true,
            data: '{model.MOVIMENTOS_ITENS}',
            proxy: {
                type: 'memory'
            }
        },

        financeiroscompra: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.movimento.ModelCompra',
            autoLoad: true,
            data: '{model.MOVIMENTOS_FINANCEIROSCOMPRA}',
            proxy: {
                type: 'memory'
            }
        },

        baixasparciais: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.movimento.ModelBaixa',
            autoLoad: true,
            data: '{model.BAIXASPARCIAIS_MOVIMENTO}',
            listeners: {
                load: function(store){
                    const viewForm = Ext.$('formmovimentos')[0];

                    //Somente se for um Pedido da pruden aço
                    if( viewForm.title == 'Pedido' && configs.getClientName() == 'prudenaco' )
                    {
                        const recordsBaixas = (Ext.$('formmovimentos')[0].model.get('BAIXASPARCIAIS_MOVIMENTO') || []);
                        const valorTotalMovimento = viewForm.model.get('MOVIMENTOS_TOTAL');

                        //Calcula o saldo restante
                        //Percorre os models da store, somando o valor das baixas 
                        let soma = 0;
                        for( let i = 0 ; i < recordsBaixas.length ; i++ )
                        {
                            soma += Number( recordsBaixas[i]['CREDITOS_VALOR'] );
                        }

                        const valorRestante = (valorTotalMovimento - soma);

                        //Remove o binding dele pois é apenas pra consulta
                        viewForm.lookupReference('subst').setBind({value: '{bidingNulo}'});
                        viewForm.lookupReference('subst').setBind({readOnly: '{readOnlyNulo}'});

                        viewForm.initGauge('Calculando Saldo Restante ...');
                        Ext.defer( ()=>{
                            //Define o valor calculado
                            viewForm.lookupReference('subst').setValue( SamosUtils.Number.float2moeda( valorRestante, true ).replace(',','.') );
                            viewForm.stopGauge();
                        }, 180, this );
                    }
                }
            },
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
                if(this.get('isOrcamento')){
                    return !cfg.includes("ORC");
                } else if(this.get('isPedido')){
                    return !cfg.includes("PED");
                } else if(this.get('isPedidoCompra')){
                    return !cfg.includes("CPA");
                } else if(this.get('isRequisicao')){
                    return !cfg.includes("REQ");
                } else if(this.get('isDevolucao')){
                    return !cfg.includes("DEV");
                } else if(this.get('isNotaEletronica')){
                    return !cfg.includes("NFE");
                } else if(this.get('isTransferencia')){
                    return !cfg.includes("TRS");
                } else if(this.get('isNotaEntrada')){
                    return true;
                }
            } else {
                return true;
            }
        } else {
            return true;
        }
    },

    checkExportacao: function(module, name) {
        const expObj = configs.getMovimentos().exportacao;
        const formasDePagamento = this.get('model.OPERACOES_FINANCEIRO') == 'O';

        const cfg = Object.keys(expObj).filter(key => {
            return expObj[key].includes(module)
        });

        if(
            Permissao.services.Model.podeIncluir({ groupName: 'Movimentos', moduleName: name }) || 
            ( name == 'Pedidos' && formasDePagamento ) ||
            ( name == 'Romaneio Entrega' && configs.getClientName() == 'prudenmoveis')
        ) {
            if(cfg && cfg[0]){
                if(this.get('isOrcamento')){
                    return !cfg.includes("ORC");
                } else if(this.get('isPedido')){
                    return !cfg.includes("PED");
                } else if(this.get('isSolicitacaoCompra')){
                    return !cfg.includes("SOL");
                } else if(this.get('isPedidoCompra')){
                    return !cfg.includes("CPA");
                } else if(this.get('isRequisicao')){
                    return !cfg.includes("REQ");
                } else if(this.get('isDevolucao')){
                    return !cfg.includes("DEV");
                } else if(this.get('isNotaEletronica')){
                    return !cfg.includes("NFE");
                } else if(this.get('isNotaEntrada')){
                    return !cfg.includes("NFC");
                } else if(this.get('isTransferencia')){
                    return !cfg.includes("TRS");
                }   
            } else {
                return true;
            }
        } else {
            return true;
        }
    }
});
