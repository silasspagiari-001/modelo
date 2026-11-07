Ext.define('SamosAdmin.movimentos.movimento.services.Documento', {
    alternateClassName: 'Movimento.services.Documento',
    singleton: true,

    atribuirDocumento: async function(documento, movimento) {
        movimento.set({
            'MOVIMENTOS_ID_DOCUMENTOS':    documento.get('DOCUMENTOS_ID'),
            'DOCUMENTOS_NOME':             documento.get('DOCUMENTOS_NOME'),
            'DOCUMENTOS_ALTERAPRECO':      documento.get('DOCUMENTOS_ALTERAPRECO'),
            'DOCUMENTOS_ID_PESSOAS':       documento.get('DOCUMENTOS_ID_PESSOAS'),
            'DOCUMENTOS_ID_OPERACOES':     documento.get('DOCUMENTOS_ID_OPERACOES'),
            'DOCUMENTOS_LAYOUT':           documento.get('DOCUMENTOS_LAYOUT'),
            'DOCUMENTOS_DESCONTOITEM':     documento.get('DOCUMENTOS_DESCONTOITEM'),
            'DOCUMENTOS_COLETACARTAO':     documento.get('DOCUMENTOS_COLETACARTAO'),
            'DOCUMENTOS_COLETACHEQUE':     documento.get('DOCUMENTOS_COLETACHEQUE'),
            'DOCUMENTOS_COLETATRANSPORTE': documento.get('DOCUMENTOS_COLETATRANSPORTE'),
            'DOCUMENTOS_COLETAENTREGA':    documento.get('DOCUMENTOS_COLETAENTREGA'),
            'DOCUMENTOS_COLETAOUTRO':      documento.get('DOCUMENTOS_COLETAOUTRO'),
            'MOVIMENTOS_ID_OPERACOES':     documento.get('DOCUMENTOS_ID_OPERACOES'),
            'OPERACOES_NOME':              documento.get('OPERACOES_NOME'),
            'OPERACOES_UNICA':             documento.get('OPERACOES_UNICA'),
            'OPERACOES_COMPLEMENTAR':      documento.get('OPERACOES_COMPLEMENTAR'),
            'OPERACOES_FINANCEIRO':        documento.get('OPERACOES_FINANCEIRO'),
            'OPERACOES_ESTOQUE':           documento.get('OPERACOES_ESTOQUE'),
            'OPERACOES_FINALIDADE':        documento.get('OPERACOES_FINALIDADE'),
            'OPERACOES_TIPO':              documento.get('OPERACOES_TIPO'),
            'OPERACOES_ACAO':              documento.get('OPERACOES_ACAO'),
            'OPERACOES_ST'  :              documento.get('OPERACOES_ST'),
            'OPERACOES_PISCOFINS':         documento.get('OPERACOES_PISCOFINS'),
            'OPERACOES_BAIXAVISTA':        documento.get('OPERACOES_BAIXAVISTA'),
            'OPERACOES_ID_APLICACOES':     documento.get('OPERACOES_ID_APLICACOES'),
            'MOVIMENTOS_ID_APLICACOES':    documento.get('DOCUMENTOS_ID_APLICACOES'),
            'APLICACOES_NOME':             documento.get('APLICACOES_NOME'),
            'MOVIMENTOS_ID_PRAZOS':        documento.get('OPERACOES_ID_PRAZOS'),
            'PRAZOS_NOME':                 documento.get('PRAZOS_NOME'),
            'PRAZOS_PARCELAS':             documento.get('PRAZOS_PARCELAS'),
            'PRAZOS_PARCELAMENTO':         documento.get('PRAZOS_PARCELAMENTO'),
            'PESSOAS_TIPO':                documento.get('PESSOAS_TIPO'),
            'PESSOAS_CELULAR':             documento.get('PESSOAS_CELULAR'),
            'CONSUMIDOR_CIDADESID':        documento.get('PESSOAS_ID_CIDADES'),
            'CONSUMIDOR_CIDADESNOME':      documento.get('CIDADES_NOME'),
            'CONSUMIDOR_CIDADESESTADO':    documento.get('CIDADES_ESTADO'),
            'PESSOAS_ID_CIDADES':          documento.get('PESSOAS_ID_CIDADES'),
            'CIDADES_NOME':                documento.get('CIDADES_NOME'),
            'CIDADES_ESTADO':              documento.get('CIDADES_ESTADO'),
            'EMPRESAS_CPFCNPJ':            documento.get('EMPRESAS_CPFCNPJ'),
            'EMPRESAS_CNAE':               documento.get('EMPRESAS_CNAE'),
            'EMPRESAS_SIMPLES':            documento.get('EMPRESAS_SIMPLES'),
            'EMPRESAS_ID_CIDADES':         documento.get('EMPRESAS_ID_CIDADES'),
            'EMPRESAS_REGIAO12':           documento.get('EMPRESAS_REGIAO12')
        });

        
        if(configs.getMovimentos().comboDocumentos && documento.get('DOCUMENTOS_ID').toString().slice(-2) == '01') {
            movimento.set('MOVIMENTOS_ID_DOCUMENTOS', 0)
        }

        const itensAtualizados = (movimento.get('MOVIMENTOS_ITENS') || []).map(item => {
            item['MOVIMENTOSITENS_ID_OPERACOES'] = documento.get('DOCUMENTOS_ID_OPERACOES');
            return item;
        });

        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);

        if(documento.get('DOCUMENTOS_COLETATRANSPORTE') == 'T') {
            movimento.get('MOVIMENTOS_ENVIO')[0]['MOVIMENTOSENVIO_ID_TRANSPORTES'] = 0;
        };

        if(documento.get('DOCUMENTOS_NOME').match(/Transfer/)) {
            movimento.set({
                'MOVIMENTOS_ID_PESSOAS':       documento.get('DOCUMENTOS_ID_PESSOAS'),
                'MOVIMENTOS_NOME':             documento.get('PESSOAS_FANTASIA'),
                'MOVIMENTOS_OBSERVACOES':      documento.get('OPERACOES_NOME') + ' ' + movimento.get('EMPRESAS_FANTASIA') + ' ' + momentServer().format('DD/MM/YYYY') + '|||||||||'
            });    
        }
    },

    iniciarVendaConsumidor: function(form) {
        form.getViewModel().set('isVendaConsumidor', true);
        this.setarConsumidorPadrao(form);
    },

    cancelarVendaConsumidor: function(form) {
        form.getViewModel().set('isVendaConsumidor', false);
        this.limparVendaConsumidor(form);
    },

    checkVendaConsumidor: function(form){
        const movimento = form.model;
        const vm = form.getViewModel()
        const isNota = vm.get('isNota');
        const isOrcamento = vm.get('isOrcamento');
        const isTransferencia = vm.get('isTransferencia');
        const idConsumidor = movimento.get('DOCUMENTOS_ID_PESSOAS');
        const idPessoa = movimento.get('MOVIMENTOS_ID_PESSOAS');


        if(movimento.get('PESSOAS_STATUS') == 'F') {
            Ext.Note('warning', 'Pessoa inativa - Contate Gerência');
            movimento.set({
                'MOVIMENTOS_ID_PESSOAS': '',
                'MOVIMENTOS_NOME':       '',
                'MOVIMENTOS_CPFCNPJ':    '',
                'CIDADES_NOME':          '',
                'CIDADES_ESTADO':        '',
                'MOVIMENTOS_EMAIL':      '',
                'PESSOAS_TELEFONE':      '',
                'MOVIMENTOS_CELULAR':    '',
            });
        }

        if(configs.getClientName() == 'stilomoveis' && isOrcamento && movimento.get('PESSOAS_TIPO') == 'N') { // Cliente sem permissão para orçamento
            Ext.Note('warning', 'Orçamento não permitido - Contate Gerência');
            movimento.set({
                'MOVIMENTOS_ID_PESSOAS': '',
                'MOVIMENTOS_NOME':       '',
                'MOVIMENTOS_CPFCNPJ':    '',
                'CIDADES_NOME':          '',
                'CIDADES_ESTADO':        '',
                'MOVIMENTOS_EMAIL':      '',
                'PESSOAS_TELEFONE':      '',
                'MOVIMENTOS_CELULAR':    '',
            });
    
        }

        if(configs.getMovimentos().carregaVendedorPessoa) { // Pega o usuário (vendedor) do cadastro da pessoa            
            const idVendedor = movimento.get('PESSOAS_ID_USUARIOS') || 0;
            const nmVendedor = movimento.get('USUARIOS_NOMEVENDEDOR') || '';
            const lgVendedor = movimento.get('USUARIOS_LOGINVENDEDOR') || '';
            if(configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor || configs.getPessoas().exibirVendedorPessoa) {
                if(nmVendedor) {
                    movimento.set('MOVIMENTOS_ID_USUARIOS', idVendedor);
                    movimento.set('USUARIOS_NOME', nmVendedor);
                    movimento.set('USUARIOS_LOGIN', lgVendedor);
                    const txtUsuario = form.lookup('vendedor');
                    txtUsuario.setValue(nmVendedor);
                    txtUsuario.setSearchedId(nmVendedor);
                    txtUsuario.onTextSearch(txtUsuario, {type: 'script'});
                } else {
                    movimento.set('MOVIMENTOS_ID_USUARIOS', configs.getUsuario().id);
                    movimento.set('USUARIOS_NOME', configs.getUsuario().nome);
                    movimento.set('USUARIOS_LOGIN', configs.getUsuario().login);
                    const txtUsuario = form.lookup('vendedor');
                    txtUsuario.setValue(configs.getUsuario().nome);
                    txtUsuario.setSearchedId(configs.getUsuario().nome);
                    txtUsuario.onTextSearch(txtUsuario, {type: 'script'});
                }    
            }
        }

        if(!isNota && !isTransferencia && form.getViewModel().get('readOnly')) { 
            form.getViewModel().set('isVendaConsumidor', idConsumidor == idPessoa);
        }
    },

    checkEntrega: function(form){
        const movimento = form.model;
        const vm = form.getViewModel()
        const isOrcamento = vm.get('isOrcamento');
        const isPedido = vm.get('isPedido');        
        const idConsumidor = movimento.get('DOCUMENTOS_ID_PESSOAS');
        const idPessoa = movimento.get('MOVIMENTOS_ID_PESSOAS');
        const tipoEntrega = form.lookup('entrega').getValue();
        const freteUrb = cents((movimento.get('EMPRESAS_CNAE')||'').split('|')[0])
        const freteSub = cents((movimento.get('EMPRESAS_CNAE')||'').split('|')[1])

        if(configs.getClientName() == 'prudenmoveis' && 
          (isOrcamento || isPedido) && 
          (idConsumidor == idPessoa)) {
            if(tipoEntrega == '1' || tipoEntrega == ' ') {
                movimento.set({
                    'MOVIMENTOS_FRETE'  : freteUrb / 100
                });    
                form.lookup('frete').setValue(freteUrb / 100);
            } else {
                movimento.set({
                    'MOVIMENTOS_FRETE'  : freteSub / 100
                });
                form.lookup('frete').setValue(freteSub / 100);
            }    

        }
    },

    limparVendaConsumidor: function(form) {
        const movimento = form.model;

        movimento.set({
            'MOVIMENTOS_ID_PESSOAS': '',
            'MOVIMENTOS_NOME':       '',
            'MOVIMENTOS_CPFCNPJ':    '',
            'CIDADES_NOME':          '',
            'CIDADES_ESTADO':        '',
            'MOVIMENTOS_EMAIL':      '',
            'PESSOAS_TELEFONE':      '',
            'MOVIMENTOS_CELULAR':    '',
        });
    },

    setarConsumidorPadrao: function(form) {
        const movimento = form.model;

        movimento.set({
            'MOVIMENTOS_ID_PESSOAS': movimento.get('DOCUMENTOS_ID_PESSOAS'),
            'MOVIMENTOS_NOME':       '',
            'MOVIMENTOS_CPFCNPJ':    '',
            'CIDADES_NOME':          movimento.get('CONSUMIDOR_CIDADESNOME'),
            'CIDADES_ESTADO':        movimento.get('CONSUMIDOR_CIDADESESTADO'),
            'MOVIMENTOS_EMAIL':      '',
            'PESSOAS_TELEFONE':      '',
            'MOVIMENTOS_CELULAR':    ''
        });
    },

    verificarSequenciaNF: async function() {
        const querySequenciaNF = await SamosUtils.Request.nodeApi({
            url: `/consultas/verificasequencianf`,
            method: 'GET'
        });

        const lista = querySequenciaNF.results[0]['LISTA'] || ''
        
        return lista.slice(0, -1);
    },

    verificarNFPendentes: async function(query) {
        const queryNFPendentes = await SamosUtils.Request.nodeApi({
            url: `/consultas/nfpendentes`,
            method: 'GET',
            query: query
        });

        if(queryNFPendentes.results.length == 0) { return false; }

        return queryNFPendentes.results.map(movimento => {
            const emissao  = momentTz(movimento['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
            const numero   = movimento['MOVIMENTOS_NUMERO'];
            const serie    = movimento['MOVIMENTOS_SERIE'];

            return `Data: ${emissao} - ${serie} ${numero}`;
                            
        }).join('<br>');
    },

    verificarPedDivergentes: async function(query) {
        const queryPedDivergentes = await SamosUtils.Request.nodeApi({
            url: `/consultas/pedidosdivergentes`,
            method: 'GET',
            query: query
        });

        if(queryPedDivergentes.results.length == 0) { return false; }

        return queryPedDivergentes.results.map(movimento => {
            const emissao  = momentTz(movimento['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
            const numero   = movimento['MOVIMENTOS_NUMERO'];
            const serie    = movimento['MOVIMENTOS_SERIE'];

            return `Data: ${emissao} - ${serie} ${numero}`;
                            
        }).join('<br>');
    },

    verificarTransfPendentes: async function(query) {
        const queryTransfPendentes = await SamosUtils.Request.nodeApi({
            url: `/consultas/transfpendentes`,
            method: 'GET',
            query: query
        });

        if(queryTransfPendentes.results.length == 0) { return false; }

        return queryTransfPendentes.results.map(movimento => {
            const emissao  = momentTz(movimento['MOVIMENTOS_EMISSAO']).format('DD/MM/YYYY');
            const numero   = movimento['MOVIMENTOS_NUMERO'];
            const serie    = movimento['MOVIMENTOS_SERIE'];

            return `Data: ${emissao} - ${serie} ${numero}`;
                            
        }).join('<br>');
    },
    
    getProximaNFe: async function() {
        const queryProximaNF = await SamosUtils.Request.nodeApi({
            url: `/consultas/ultimomovimento`,
            method: 'GET',
            query: {
                docto: configs.getEmpresa().id.toString() + '0003',
                empresa: configs.getEmpresa().id
            }
        });

        const numeroNf = queryProximaNF.results[0]['ULTIMO'] || 0
        
        return numeroNf
    }
 
});
