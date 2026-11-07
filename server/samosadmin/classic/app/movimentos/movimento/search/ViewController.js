Ext.define('SamosAdmin.movimentos.movimento.search.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.movimentossearch',

    getBuscarParams: async function () {
        const vm = this.getViewModel();

        const form = Ext.$('formmovimentos')[0]      ||  
                     Ext.$('emissaoetiquetas')[0]    || 
                     Ext.$('formmanifestos')[0]      ||
                     Ext.$('formconhecimento')[0]    ||                     
                     Ext.$('formromaneiosmoveis')[0] ||           
                     Ext.$('formromaneiosconstrucao')[0];

        const isRom  = Number(form.getViewModel().get('model.ROMANEIOS_ID_PESSOAS')) > 0;
        const tipRom = form.getViewModel().get('model.ROMANEIOS_PLACA') || 'E';  // Romaneio, padrao (E)ntrega

        const title = form.title;

        const nomeDocumento = title == 'Transferências' ? 'Transferências Saída' : 
                              title == 'Romaneio' && tipRom == 'A' ? 'Transferências Saída' :
                              title == 'Romaneio' && tipRom != 'A' ? 'Pedidos' :
                              title == 'Manifesto'               ? 'Nota Eletrônica' :                              
                              title == 'Conhecimento Transporte' ? 'Nota Eletrônica' :                                                            
                              title == 'Nota' ? (configs.getMovimentos().exibirRequisicaoNfe ? 'Requisições' : 'Pedidos Compra') :
                              title;
        return {
            empresa      : vm.get('multiEmpresa') == undefined ? configs.getEmpresa().id : (vm.get('multiEmpresa') ? '' : configs.getEmpresa().id),
            documento    : '', //trazer pelo nome
            nomedocumento: nomeDocumento,
            numero       : vm.get('valueNumero') || vm.get('valueConteudo'),
            pessoa       : vm.get('valueIdPessoa'),
            inicio       : momentTz(vm.get('valueInicio')).format('DD/MM/YYYY'),
            final        : momentTz(vm.get('valueFinal')).format('DD/MM/YYYY'),
            ordem        : vm.get('valueOrdem'),
            status       : vm.get('valueStatus'),
            limit        : configs.getClientName() == 'herbiquimica' ? 999 : 50,
            isromaneio   : isRom,
            situacao     : null
        };
    },

    onItemDblClick: function (grid, record) {
        const view = this.getView();
        const manifestos = Ext.$('formmanifestos')[0] ? true : false;
        const romaneiomoveis = view.viewOrigin.title == 'Romaneio' && configs.getMovimentos().ramoRomaneio == 'moveis';
        const isMontagem = this.getView().viewOrigin.listName.match(/Montagem/) && configs.getMovimentos().ramoRomaneio == 'moveis';
        const isNotaEntrada = this.getView().viewOrigin.listName.match(/Entrada/) && configs.getMovimentos().exibirRequisicaoNfe;
        const idPessoaMovimento = view.viewOrigin.getController().getRecord().get('MOVIMENTOS_ID_PESSOAS');
        const isRequisicaoEntrada = parseInt(record.get('MOVIMENTOS_ID_OPERACOES')) < 500000; 
        const idPessoaRequisicao = record.get('MOVIMENTOS_ID_PESSOAS');
        const ufEmpresaLogada = configs.getPermissao()['CIDADES_ESTADO'];
        const ufCliente = record.get('CIDADES_ESTADO');

        if(isNotaEntrada && idPessoaMovimento != idPessoaRequisicao) {
            Ext.Note('warning', 'Pessoa da Requisição Difere da Nota de Entrada');
            return;
        }

        if(isNotaEntrada && !isRequisicaoEntrada) {
            Ext.Note('warning', 'Não é Requisição de Entrada' + record.get('MOVIMENTOS_ID_OPERACOES'));
            return;
        }

        if(manifestos && ufEmpresaLogada == ufCliente) {
            Ext.Note('warning', 'Dentro do estado não é permitido manifesto');
        } else if(romaneiomoveis) {
            const storePedidos = view.viewOrigin.lookup('pedidos').getStore();
            const local = view.viewOrigin.getController().getRecord().get('ROMANEIOS_LOCAL');
            const isAbastecimento = view.viewOrigin.getController().getRecord().get('ROMANEIOS_PLACA') == 'A';
            const cidadeEmpresaMovimento = record.get('EMPRESAS_ID_CIDADES');
            const cidadeCliente = record.get('PESSOAS_ID_CIDADES');
            const statusReservas = record.get('RESERVAS_STATUS');
            const emissao = momentTz(record.get('MOVIMENTOS_EMISSAO')).hours(0).minutes(0).seconds(0);
            const hoje = momentServer().hours(0).minutes(0).seconds(0);
            const tempoPedidoEmDias = (hoje - emissao) / 1000 / 60 / 60 / 24;
            const limiteDias = configs.getMovimentos().limiteDiasPedidoRomaneio || 99999;
            const jaExistente = (storePedidos.data.items || []).find(pedido => {
                return pedido.get('ROMANEIOSITENS_ID_MOVIMENTOS') == record.get('MOVIMENTOS_ID');
            });

            if(jaExistente && view.txt. getSearchedId() != record.get('MOVIMENTOS_NUMERO')) {
                Ext.Note('warning', 'Pedido já incluído na lista');
                view.txt.setValue('');
                setTimeout(() => {
                    view.txt.focus(true);
                }, 300);
            } else if(local == 'U' && cidadeEmpresaMovimento != cidadeCliente && !isMontagem) {
                Ext.Note('warning', 'Pedido suburbano');
                view.txt.setValue('');
                setTimeout(() => {
                    view.txt.focus(true);
                }, 300);
            } else if(local == 'S' && cidadeEmpresaMovimento == cidadeCliente) {
                Ext.Note('warning', 'Pedido urbano');
                view.txt.setValue('');
                setTimeout(() => {
                    view.txt.focus(true);
                }, 300);
            } else if(statusReservas == 'F'  && !isAbastecimento){
                Ext.Note('warning', 'Pedido sem reserva');
                view.txt.setValue('');
                setTimeout(() => {
                    view.txt.focus(true);
                }, 300);
            } else if(
                !configs.getUsuario().privilegiado && tempoPedidoEmDias > limiteDias
            ){
                if(!this.permiteInclusao){
                    Ext.Note('warning', 'Pedido emitido há mais de ' + limiteDias + ' dias');
                    
                    const nivel = 1;
        
                    Ext.create({ xtype: 'samoswidgets-senhanivel' })
                        .iniciar(nivel)
                        .then(() => {
                            this.permiteInclusao = true;
                            this.onItemDblClick(grid, record);
                        })
                        .catch(() => {
                            view.txt.setValue('');
                            setTimeout(() => {
                                view.txt.focus(true);
                            }, 300);
                        });
                } else {
                    delete this.permiteInclusao;
                    this.callParent(arguments);
                }
            } else {
                this.callParent(arguments);
            }
        } else {
            this.callParent(arguments);
        }
    }
});
