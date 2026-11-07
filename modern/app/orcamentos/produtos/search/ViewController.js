Ext.define('SamosAdminModern.orcamentos.produtos.search.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.orcamentosprodutossearch',

    showButtons: function() {
        const main = this.getView().up('main');

        main.down('image[reference="logo"]').hide();
        
        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        })
    },

    onPesquisarClick: async function() {
        const view = this.getView();
        const vm = this.getViewModel();

        try {
            view.initGauge();

            const store = vm.getStore('main');
            
            store.currentPage = 1;

            store.removeAll();

            store.getProxy().setExtraParams({
                empresa : configs.getEmpresa().id,
                conteudo: vm.get('valueConteudo'),
                ordem   : 1,
                status  : 'T'
            });

            const records = await store.load();

            (records || []).forEach(record => {
                Ext.Object.merge(record.data, record.get('SALDOS')[0]);
                Ext.Object.merge(record.data, record.get('NCMS')[0]);
                delete record.data['SALDOS'];
                delete record.data['NCMS'];

                const preco = cents(record.data[configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO']);

                if(configs.getMovimentos().descontoMaximo != 'SALDOS_PRECOMINIMO') {
                    if(
                        configs.getUsuario().privilegiado && 
                        configs.getMovimentos().senhaDescontoPrivilegiado === false
                    ) {
                        record.data['SALDOS_PRECOMINIMO'] = 0;
                    } else {
                        record.data['SALDOS_PRECOMINIMO'] = (preco - parseInt(preco * (configs.getMovimentos().descontoMaximo || 100) / 100)) / 100
                    }
                }
                
                record.data['SALDOS_DEPOSITO'] = (record.data['SALDOSGERAL'] || []).filter(saldo => {
                    return (saldo['EMPRESAS_FANTASIA'] || '').match(/CD/i);
                }).reduce((total, saldo) => {
                    return total += saldo['SALDOS_DISPONIVEL'];
                }, 0);

                record.data['SALDOS'] = record.data['SALDOSGERAL'];
            });

            this.getView().down('list').resync(true);//force=true

        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao buscar')
        }

        view.stopGauge();
    },

    onItemClick: function (dataview, index, target, record, e) {
        const main = this.getView().up('main');
        
        main.down('panel').setActiveItem('orcamentosprodutos');
        main.down('container[reference="title"]').setHtml('Orçamentos - Itens');

        const movimento = main.down('panel').getActiveItem().getViewModel().get('model');
        const produto   = main.down('panel').getActiveItem().getViewModel().get('produto');

        const finalidadeNormal = movimento.get('OPERACOES_FINALIDADE') == 'N'; 
        const ufConsumidor     = movimento.get('CIDADES_ESTADO');
        const ufEmpresa        = configs.getPermissao()['CIDADES_ESTADO'];
        const cst              = ufConsumidor == ufEmpresa ? 'CSTLOCAL' : 'CSTOUTROS';
        const simplesNacional  = configs.getPermissao()['EMPRESAS_SIMPLES'] == 'T' ||
                                 configs.getPermissao()['EMPRESAS_SIMPLES'] == '0';

        let preco = 0;
        
        if(configs.getMovimentos().promocaoBasica && cents(record.get('VALOR_PROMOCAO')) > 0) {
            preco = cents(record.get('VALOR_PROMOCAO'));
        } else {
            preco = cents(record.get(configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO'));
        }
        
        produto.set({
            'MOVIMENTOSITENS_ID_PRODUTOS'  : record.get('PRODUTOS_ID'),
            'PRODUTOS_STATUS'              : record.get('PRODUTOS_STATUS'),
            'PRODUTOS_NOME'                : record.get('PRODUTOS_NOME'),
            'PRODUTOS_MARCA'               : record.get('PRODUTOS_MARCA'),
            'PRODUTOS_APLICACAO'           : record.get('PRODUTOS_APLICACAO'),
            'PRODUTOS_FABRICA'             : record.get('PRODUTOS_FABRICA'),
            'PRODUTOS_DERIVADO'            : record.get('PRODUTOS_DERIVADO'),
            'PRODUTOS_DESCRICAO'           : record.get('PRODUTOS_DESCRICAO'),
            'PRODUTOS_PESOLIQUIDO'         : record.get('PRODUTOS_PESOLIQUIDO'),
            'PRODUTOS_PESOBRUTO'           : record.get('PRODUTOS_PESOBRUTO'),
            'PRODUTOS_UNIDADE'             : record.get('PRODUTOS_UNIDADE'),
            'PRODUTOS_MARCA'               : record.get('PRODUTOS_MARCA'),
            'MOVIMENTOSITENS_CUSTO'        : record.get('SALDOS_CUSTO'),
            'NOVO_PRECO'                   : record.get('SALDOS_COMPRA'),
            'SALDOS_MARGEM'                : record.get('SALDOS_MARGEM'),
            'SALDOS_CUSTO'                 : record.get('SALDOS_CUSTO'),
            'SALDOS_COMPRA'                : record.get('SALDOS_COMPRA'),
            'SALDOS_PRAZO'                 : record.get('SALDOS_PRAZO'),
            'SALDOS_PRECO'                 : record.get('SALDOS_PRECO'),
            'SALDOS_TRANSFERENCIA'         : record.get('SALDOS_TRANSFERENCIA'),
            'SALDOS_PRECOMINIMO'           : record.get('SALDOS_PRECOMINIMO'),
            'VALOR_PROMOCAO'               : record.get('VALOR_PROMOCAO'),
            'SALDOS_DISPONIVEL'            : record.get('SALDOS_DISPONIVEL'),
            'SALDOS_DEPOSITO'              : record.get('SALDOS_DEPOSITO'),
            'SALDOS_CSTLOCAL'              : record.get('SALDOS_CSTLOCAL'),
            'SALDOS_CSTOUTROS'             : record.get('SALDOS_CSTOUTROS'),
            'SALDOS_IPI'                   : record.get('SALDOS_IPI'),
            'SALDOS_ICMSLC'                : record.get('SALDOS_ICMSLC'),
            'SALDOS_ICMS01'                : record.get('SALDOS_ICMS01'),
            'SALDOS_ICMS02'                : record.get('SALDOS_ICMS02'),
            'SALDOS_BASELC'                : record.get('SALDOS_BASELC'),
            'SALDOS_BASE01'                : record.get('SALDOS_BASE01'),
            'SALDOS_BASE02'                : record.get('SALDOS_BASE02'),
            'SALDOS_LOCAL'                 : record.get('SALDOS_LOCAL'),
            'NCMS_NCM'                     : record.get('NCMS_NCM'),
            'NCMS_ALIQUOTANACIONAL'        : record.get('NCMS_ALIQUOTANACIONAL'),
            'NCMS_ALIQUOTAESTADUAL'        : record.get('NCMS_ALIQUOTAESTADUAL'),
            'NCMS_ALIQUOTAIMPORTADO'       : record.get('NCMS_ALIQUOTAIMPORTADO'),
            'NCMS_ALIQUOTAMUNICIPAL'       : record.get('NCMS_ALIQUOTAMUNICIPAL'),
            'NCMS_CSTPIS'                  : record.get('NCMS_CSTPIS'),
            'NCMS_CSTCOFINS'               : record.get('NCMS_CSTCOFINS'),
            'NCMS_ALIQUOTAPIS'             : record.get('NCMS_ALIQUOTAPIS'),
            'NCMS_ALIQUOTACOFINS'          : record.get('NCMS_ALIQUOTACOFINS'),
            'NCMS_ALIQUOTAFCP'             : record.get('NCMS_ALIQUOTAFCP'),
            'MONTAGENS_VALOR'              : record.get('MONTAGENS_VALOR'),
            'MOVIMENTOSITENS_EXCECAO'      : record.get('SALDOS_EXCECAO'),
            'MOVIMENTOSITENS_CST'          : produto.get('MOVIMENTOSITENS_CST') || finalidadeNormal ? record.get(`SALDOS_${cst}`) : simplesNacional ? '0900' : '090',
            'MOVIMENTOSITENS_ID_OPERACOES' : movimento.get('MOVIMENTOS_ID_OPERACOES'),
            'OPERACOES_NOME'               : movimento.get('OPERACOES_NOME'),
            'MOVIMENTOSITENS_ESCRITURACAO' : record.get('SALDOS_ESCRITURACAO'),
            'NOVO_MARGEM'                  : record.get('SALDOS_MARGEM'),
            'MOVIMENTOSITENS_QUANTIDADE'   : 1,
            'MOVIMENTOSITENS_PRECO'        : preco / 100,
            'MOVIMENTOSITENS_TOTAL'        : preco / 100,
            'TOTAL_LIQUIDO'                : preco / 100,
            'VALOR_LIQUIDO'                : preco / 100
        });

        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: false,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : false
        });
    },

    onVoltarClick: function() {
        const main = this.getView().up('main');

        main.down('panel').setActiveItem('orcamentosprodutos');
        main.down('container[reference="title"]').setHtml('Orçamentos - Itens');

        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: false,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : false
        });
    }
});
