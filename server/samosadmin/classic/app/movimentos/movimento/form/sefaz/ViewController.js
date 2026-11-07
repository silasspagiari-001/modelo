Ext.define('SamosAdmin.movimentos.movimento.form.sefaz.ViewController', {
    extend: 'SamosAdmin.movimentos.movimento.form.ViewController',
    alias: 'controller.formmovimentossefaz',

    initViewModel: function(vm) {
        Ext.asap(async () => {
            const view = this.getView();
            
            if(view.tipo == 'MOVIMENTOS' && vm.get('isNotaEletronica')){
                view.initGauge();
    
                try{
                    const nfPendentes = await Movimento.services.Documento.verificarNFPendentes({ 
                        excecao   : vm.get('model.MOVIMENTOS_ID'),
                        meses     : 1,
                        incluiHoje: 'T'
                    });
        
                    if(nfPendentes) {
                        SamosUtils.Msg.alert('Lembrete', `Há notas a serem enviadas!<br><h5>${nfPendentes}<h5>`, 4000);
                    }

                } catch(error) {
                    SamosUtils.Msg.error(error, `Falha ao verificar NF's pendentes`);
                }
    
                view.stopGauge(true);
            }

            if(configs.getMovimentos().autoEnvioSefaz &&
               configs.getUsuario().tipo != '0' &&
               !vm.get('hasProtocolo')) {
                Ext.defer(this.onEnviarClick, 500, this);
            }
            
        });
    },
    
    onStatusClick: async function(btn, e) {
        const view = this.getView();

        try {
            view.initGauge();
            await this.chamadaSefazTXT('status');
        } catch(error) {
            this.showResults('Falha ao consultar status');
            SamosUtils.Msg.error(error, 'Falha ao consultar status');
        }

        view.stopGauge();
    },

    onEnviarClick: async function(btn, e) {
        const view = this.getView();

        const form = (view.tipo == 'CONHECIMENTOS') ? view.up('formconhecimento') :
                     (view.tipo == 'ORDENS') ? view.up('formnotaservicos') : view.up('form' + this.getView().tipo.toLowerCase());

        if( form.model.get('MOVIMENTOS_SERIEORIGEM') &&
            form.model.get('MOVIMENTOS_NUMEROORIGEM') &&
            form.model.get('MOVIMENTOS_ID_EMPRESAORIGEM')
        ){
            if( form.model.get('MOVIMENTOS_SERIEORIGEM') == 'OS' ){
                const queryOSOrigem = await SamosUtils.Request.nodeApi({
                    url: `/processos/executasql`,
                    method: 'GET',
                    query: {
                        nomeSql: 'getordemservicoorigem',
                        parametroSql: JSON.stringify({
                            serie   : form.model.get('MOVIMENTOS_SERIEORIGEM'),
                            numero  : form.model.get('MOVIMENTOS_NUMEROORIGEM'),
                            empresa : form.model.get('MOVIMENTOS_ID_EMPRESAORIGEM')
                        })
                    }
                });

                if( queryOSOrigem.results[0] ){
                    if(queryOSOrigem.results[0]['ORDENS_ID_PESSOAS'] != form.model.get('MOVIMENTOS_ID_PESSOAS') ){
                        Ext.defer(()=>{
                            Ext.Note('warning', 'Pessoa do movimento é diferente da pessoa de origem - não permitido.');
                        }, 200, this);
                        return;
                    }
                }

            }else{
                const queryMovimentoOrigem = await SamosUtils.Request.nodeApi({
                    url: `/processos/executasql`,
                    method: 'GET',
                    query: {
                        nomeSql: 'getmovimentoorigem',
                        parametroSql: JSON.stringify({
                            serie   : form.model.get('MOVIMENTOS_SERIEORIGEM'),
                            numero  : form.model.get('MOVIMENTOS_NUMEROORIGEM'),
                            empresa : form.model.get('MOVIMENTOS_ID_EMPRESAORIGEM')
                        })
                    }
                });

                if( queryMovimentoOrigem.results[0] ){
                    if((form.model.get('MOVIMENTOS_NUMEROORIGEM') || 0) != 99999) {
                        if((queryMovimentoOrigem.results[0]['MOVIMENTOS_ID_DOCUMENTOS'] || '').toString().slice(-4) != '0004' && // Ignora requisições
                        (queryMovimentoOrigem.results[0]['MOVIMENTOS_ID_DOCUMENTOS'] || '').toString().slice(-4) != '0005' && // Ignora notas de entrada
                        (queryMovimentoOrigem.results[0]['MOVIMENTOS_ID_PESSOAS'] != form.model.get('MOVIMENTOS_ID_PESSOAS') || cents(queryMovimentoOrigem.results[0]['MOVIMENTOS_ID_PROPRIEDADES']) != cents(form.model.get('MOVIMENTOS_ID_PROPRIEDADES'))) && 
                            queryMovimentoOrigem.results[0]['MOVIMENTOS_ID_PESSOAS'] != queryMovimentoOrigem.results[0]['DOCUMENTOS_ID_PESSOAS']
                        ){
                            Ext.defer(()=>{
                                Ext.Note('warning', 'Pessoa/Propriedade do movimento é diferente do movimento de origem - não permitido.');
                            }, 200, this);
                            return;
                        }
                    }
                }
            }
        }

        const cpfcnpjmovimento = SamosUtils.String.onlyNumbers(form.model.get('MOVIMENTOS_CPFCNPJ')) || '';
        const ieMovimento = cents(form.model.get('MOVIMENTOS_ID_PROPRIEDADES')) > 0 ?
                            (SamosUtils.String.onlyNumbers(form.model.get('PROPRIEDADES_INSCRICAO')) || ''):
                            (SamosUtils.String.onlyNumbers(form.model.get('PESSOAS_INSCRICAO')) || '');
        const ufDestino = cents(form.model.get('MOVIMENTOS_ID_PROPRIEDADES')) > 0 ? form.model.get('CIDADES_ESTADOPROPRIEDADE') : form.model.get('CIDADES_ESTADO')
        const protocoloMovimento = SamosUtils.String.onlyNumbers( form.model.get('MOVIMENTOS_PROTOCOLO') ) || '';
        let listaSemReceituario = '';
        let listaSemCBenef = '';

        if( form.getViewModel().get('isNotaEletronica') &&
            cpfcnpjmovimento.length == 14 && 
            ieMovimento.toString().length > 0 &&
            !configs.getMovimentos().desativaApiCnpj &&
            protocoloMovimento == '' 
        ){
            //Valida inscrição valida
            //Valida CNPJ se nao esta cancelado
            view.initGauge('Consultando SEFAZ...');

            const url = new URL(`https://api.cnpja.com/office/${ SamosUtils.String.onlyNumbers(cpfcnpjmovimento.trim()) }?registrations=BR`);
            const consulta = await fetch(url, {
                method: 'GET',
                headers: {
                   'Content-Type': 'application/json',
                   'Authorization': '393ca38d-9a7b-48c1-9cc2-80f85ca7a5c3-7d08b990-6efb-46c7-bf13-597f44a43983'
                }
            });
            const resultadoConsulta = (await consulta.json());

            const inscricoesResultado =  resultadoConsulta['registrations']|| [];

            inscricoesResultado.sort((a, b) => {
                if (a['statusDate'] < b['statusDate']) {
                    return 1;
                  }
                  if (a['statusDate'] > b['statusDate']) {
                    return -1;
                  }
                  return 0;
            });

            let ieInvalida = '';
            let listaIEs = '';

            if(inscricoesResultado.length > 0) {
                for(let i in inscricoesResultado) {
                    listaIEs += 'UF: ' + ufDestino + 
                                ' IE: ' + inscricoesResultado[i]['number'] + 
                                ' Status: ' + (inscricoesResultado[i]['enabled'].toString() == 'true' ? 'Ativa': 'Baixada') + '\n' ;

                    if(inscricoesResultado[i]['number'].trim() == ieMovimento.trim() &&
                       inscricoesResultado[i]['state'] == ufDestino &&
                       inscricoesResultado[i]['enabled'].toString() == 'false') {
                        ieInvalida = 'X';
                    }                        
                }    
            }

            if(ieInvalida){
                view.stopGauge();                
                this.showResults(listaIEs + 'Envio não permitido - IE com Irregularidade');
                return;
            }

            view.stopGauge();
            
        }

        if( configs.getEmpresa().ambiente == 'H'){
            Ext.Note('warning', 'Enviando nota em homologação!');
        }

        if(form.getViewModel().get('isNotaEletronica')) {         // checagem NCM/ST/Receituário/CBenef
            const form = Ext.$('formmovimentos')[0] || [];
            let listaNcmInativo = '';
            let listaSemST = '';
            const itensMovimento = form.down('samoswidgets-griditems').getStore().getData().items || [];        
            let itensNcmInativo = itensMovimento.filter(item => {
                return (item.get('NCMS_STATUS') || '').match(/F/);
            });    
            if(itensNcmInativo.length > 0) {
                itensNcmInativo.forEach(produto => {
                    listaNcmInativo += produto.get('MOVIMENTOSITENS_ID_PRODUTOS') + ', ';
                });
                Ext.Note('warning', 'Produto(s): ' + listaNcmInativo + 'com NCM inativo ou inválido - Corrigir');
                return;
            }    
            let itensSemST = itensMovimento.filter(item => {
                return (item.get('OPERACOES_ST') || '').match(/T/) && cents(item.get('MOVIMENTOSITENS_VALORST')) == 0;
            });    
            if(itensSemST.length > 0) {
                itensSemST.forEach(produto => {
                    listaSemST += produto.get('MOVIMENTOSITENS_ID_PRODUTOS') + ', ';
                });  
                Ext.Note('warning', 'Produto(s): ' + listaSemST + 'deve ter valor ST mas está zero - Contate suporte');
                return;
            }

            if(configs.getClientName() == 'herbiquimica') {
                let itensSemReceituario = itensMovimento.filter(item => {
                    return (item.get('PRODUTOS_LISTAPRECO') || '') == 'T' && item.get('MOVIMENTOSITENS_HORAENTREGA') == '';
                });    
                if(itensSemReceituario.length > 0) {
                    itensSemReceituario.forEach(produto => {
                        listaSemReceituario += produto.get('MOVIMENTOSITENS_ID_PRODUTOS') + ', ';
                    });
                }    
            } 
            
            if(configs.getMovimentos().bloquearSemCBenef) { 
                let itensSemcBenef = itensMovimento.filter(item => {
                    return (item.get('SALDOS_BENEFICIOLC') || '') == 'SEM CBENEF' && item.get('MOVIMENTOSITENS_CST').trim().slice(-2).match(/20|40/);
                });    
                if(itensSemcBenef.length > 0) {
                    itensSemcBenef.forEach(produto => {
                        listaSemCBenef += produto.get('MOVIMENTOSITENS_ID_PRODUTOS') + ', ';
                    });
                }    
            }
        }

        Ext.defer( async()=>{
            try {

/*                const email = form.model.get('MOVIMENTOS_EMAIL');
    
                if(view.tipo == 'MOVIMENTOS') {
                    if(!SamosUtils.String.isEmail(email)) {
                        throw 'O email informado na nota é inválido';
                    }    
                }
*/                    

                if(listaSemReceituario) {
                    let confirmaReceituario = await SamosUtils.Msg.confirm('Produtos: ' + listaSemReceituario + ' Sem Nº da Receita - envia assim mesmo?');
                    if(!confirmaReceituario) {
                        throw 'Informe o(s) número(s) do(s) receituário(s) antes de enviar a Nota Eletrônica';
                    }    
                }

                if(configs.getMovimentos().bloquearSemCBenef) {
                    if(listaSemCBenef) {
                        throw 'Produtos: ' + listaSemCBenef + ' Sem CBenef cadastrado - corrigir antes de enviar para SEFAZ';
                    }
                }

                let confirmaEnvio = '';

                if(configs.getMovimentos().autoEnvioSefaz && 
                   configs.getUsuario().tipo != '0' &&
                   form.getViewModel().get('isNotaEletronica')) {
                    confirmaEnvio = true;
                } else {
                    confirmaEnvio = await SamosUtils.Msg.confirm('Deseja realmente enviar?');
                }

                if(!confirmaEnvio) {
                    view.stopGauge();
                }

                if(configs.getMovimentos().autoEnvioSefaz || confirmaEnvio) {
                    view.initGauge();

                    console.time('Envio Nota Sefaz');

                    await this.chamadaSefazTXT('enviar');

                    console.timeEnd('Envio Nota Sefaz');

                    console.time('Reload Nota');
                    await form.listView.getController().onBuscarClick();
                    console.timeEnd('Reload Nota');

                    if(this.xml && configs.getClientName() == 'hospitalar') {
                        console.time('Envio XML VTEX');
                        
                        const queryEnvioXMLVTEX = await SamosUtils.Request.nodeApi({
                            url: `/processos/vtex/atualizarnfpedido`,
                            method: 'POST',
                            data: {
                                'xml'                    : this.xml,
                                'usuariosNotificar'      : configs.getMovimentos().usuariosNotificarEtiquetaVipp || [1],
                                'MOVIMENTOS_NUMERO'      : form.model.get('MOVIMENTOS_NUMERO'),
                                'MOVIMENTOS_SERIE'       : form.model.get('MOVIMENTOS_SERIE'),
                                'MOVIMENTOS_NUMEROORIGEM': form.model.get('MOVIMENTOS_NUMEROORIGEM'),
                                'MOVIMENTOS_SERIEORIGEM' : form.model.get('MOVIMENTOS_SERIEORIGEM')
                            }
                        });
                        console.timeEnd('Envio XML VTEX');

                        if(queryEnvioXMLVTEX.status != 201) {
                            Ext.Note('error', 'Falha ao enviar XML para a VTEX');
                        }
                    }                    
                }
                
            } catch(error) {
                this.showResults('Falha ao enviar');
                SamosUtils.Msg.error(error, 'Falha ao enviar');
            }

            if((form.model.get('MOVIMENTOS_PROTOCOLO') || '').length > 0) {
                await this.chamadaSefazTXT('consultar');
            }

            if( form.getViewModel().get('isNotaEletronica') && form.getViewModel().get('hasProtocolo')) {
                if(configs.getMovimentos().autoEnvioSefaz) {
                    await form.getController().onGerarPDFsClick(); // REDIS - pdf nota e boleto (se tiver)
                } else {
                    if(configs.getFinanceiros().boletos.pix || configs.getMovimentos().envioAutomaticoBoleto) { // Se boleto pix sem autoEnvio, já gera o NN do boleto
                        const dataFinanceiro = (form.model.get('MOVIMENTOS_FINANCEIROS') || []);
                        const titulos = dataFinanceiro.filter(titulo => {
                            return (
                                titulo['FINANCEIROS_STATUS'] != 'P' 
                                //titulo['FINANCEIROS_ID_PORTADORES'] == configs.getEmpresa().portador
                            );
                        });
                        
                        if(titulos.length > 0) {            
                            const idsSemNossoNumero = titulos.filter(titulo => (cents(titulo['FINANCEIROS_NOSSONUMERO']) == 0)).map(titulo => titulo['FINANCEIROS_ID']).join(',');                
                            const idPortador = cents(titulos[0]['FINANCEIROS_ID_PORTADORES']) / 100;
                            if(idsSemNossoNumero.length > 0) {
                                await this.gerarNossoNumero(idsSemNossoNumero, (idPortador || configs.getEmpresa().portador));
                            }            
                        }    
                    }
                }

            }    
            
            if((configs.getMovimentos().envioAutomaticoXML ||
                 form.model.get('XML_AUTOMATICO') == 'T') && 
                 form.getViewModel().get('hasProtocolo') &&
                 configs.getEmpresa().ambiente != 'H') {
                console.time('Envio Email XML');
                await this.onEnviarEmailClick({ automatico: true });
                console.timeEnd('Envio Email XML');
            }

            view.stopGauge();
        }, 500, this );
    },

    onEmitirClick: async function(btn, e) {
        const view = this.getView();

        let formMovimentoRef = Ext.$('formmovimentos')[0];
        
        //Se for manifesto
        if( view.tipo && view.tipo == 'MANIFESTOS' ){
            formMovimentoRef = Ext.$('formmanifestos')[0];
        }


        view.initGauge();

        try {
            await this.imprimirPDF();

        } catch(error) {
            this.showResults('Falha ao emitir');
            SamosUtils.Msg.error(error, 'Falha ao emitir');
        }

        view.stopGauge(true);
    },

    onVisualizarClick: async function(btn, e) {
        const view = this.getView();

        view.initGauge();
        
        try {
            await this.imprimirPDF();
        } catch(error) {
            this.showResults('Falha ao gerar visualização');
            SamosUtils.Msg.error(error, 'Falha ao gerar visualização');
        }

        view.stopGauge(true);
    },

    imprimirPDF: async function() {       
        const caminhoPDF = await this.gerarPDF();

        if(caminhoPDF) {
            await SamosUtils.Utils.sleep(600);
            
            SamosUtils.Pdf.exibir({
                local: 'window',
                caminho: caminhoPDF, 
                serverType: 'nodejs'
            });
        }
    },  

    onSairClick: async function(btn, event) {
        if(this.getView().up('window')) {
            this.getView().up('window').destroy();
        }

        this.callParent(arguments);

        let saidaAuto = localStorage.getItem('letraCaixa') || 'N';

        if(configs.getClientName() == 'racaforte' && saidaAuto != 'N' && configs.getUsuario().id != 1) {
            await this.getView().up('formmovimentos').getController().onSairClick();
            await Ext.$('movimentos')[0].getController().onSairClick();
            const tabpanel   = Ext.$('samosviewport')[0].down('tabpanel');
            let listPedidos;  
            const permissoes = Permissao.services.Model.get({
                groupName: 'Movimentos',
                moduleName: 'Pedidos'
            });    

            const create  = permissoes.create;
            const update  = permissoes.update;
            const destroy = permissoes.destroy;
    
            listPedidos = tabpanel.add({
                xtype: 'movimentos',
                title: 'Pedidos',
                permissoes: {
                    lockNovo:    create  === false || create  === 'F',
                    lockAlterar: update  === false || update  === 'F',
                    lockExcluir: destroy === false || destroy === 'F'
                }
            });

            tabpanel.setActiveTab(listPedidos);

        } else {
            if(this.getListView() && this.getListView().down('grid')) {
                this.getListView().down('grid').focusSelectedItem();        
            }    
        }
    },

    gerarPDF: async function() {
        const model = this.getRecord();
        const tipo = this.getView().tipo;
        const id = model.get(tipo + '_ID');
        const ufEmitente = configs.getEmpresa().estado;
        const ufDestino = (tipo == 'MOVIMENTOS' && model.get('MOVIMENTOS_ID_PROPRIEDADES') > 0) ? model.get('CIDADES_ESTADOPROPRIEDADE') : model.get('CIDADES_ESTADO');
        const estadosRegiao12 = (tipo == 'MOVIMENTOS' ? model.get('EMPRESAS_REGIAO12') : '');
        const isLocal = (ufEmitente == ufDestino);
        const isRegiao12 = estadosRegiao12.indexOf(ufDestino) > 0
        const isIbsCbs = configs.getMovimentos().layoutIBSCBS || false;
        const regimeSimples = (model.get('EMPRESAS_SIMPLES') || '').match(/0|T/);
                                
        const acao  = model.get('OPERACOES_ACAO');

        const docto = tipo == 'MOVIMENTOS'    ? ((isIbsCbs && !regimeSimples) ? 'danfeibs'  : 'danfe') :
                      tipo == 'MANIFESTOS'    ? 'damdfe' : 
                      tipo == 'CONHECIMENTOS' ? 'dacte' : 'danfs'
                                            
        if(tipo == 'MOVIMENTOS') {
            if(configs.getMovimentos().gerarTransferenciasNfe && 
                model.get('MOVIMENTOS_PROTOCOLO').length > 0 &&
                model.get('MOVIMENTOS_STATUS') != 'C' &&
                acao == 'TS') {  // Transferência
                await SamosUtils.Request.nodeApi({
                    url: `/processos/gerartransferencia`,
                    method: 'GET',
                    query: {
                        id: id
                    }
                });    
            }       
        }
                            
        const queryPDF = await SamosUtils.Request.nodeApi({
            url: `/docsfiscais/${configs.getClientName()}/${docto}/${id}`,
            method: 'GET',
            data: {
                convenio: isLocal ? configs.getProdutos().conveniolocal :
                          isRegiao12 ? configs.getProdutos().convenio12 :
                          configs.getProdutos().conveniooutros,
                tabelaservicos: configs.getMovimentos().tabelaServicos || []          
            }
        });

        return queryPDF.results[0]['name'];
    },  

    gerarPDFBoletos: async function(ids, idPortador) {

        const layBoleto = configs.getFinanceiros().boletos.pix ? 'boletospix' : 'boletos';

        const queryPDFBoleto = await SamosUtils.Request.nodeApi({
            url: `/relatorios/${configs.getClientName()}/${layBoleto}`,
            method: 'GET',
            data: {
                ids: ids,
                empresa: configs.getEmpresa().id,
                portador: idPortador || configs.getEmpresa().portador
            }
        });

        return queryPDFBoleto.results[0]['name'];
    },  

    onConsultarClick: async function(btn, e) {
        const view = this.getView();

        try {
            view.initGauge();          
            await this.chamadaSefazTXT('consultar');
        } catch(error) {
            this.showResults('Falha ao consultar');
            SamosUtils.Msg.error(error, 'Falha ao consultar');
        }

        view.stopGauge();
    },

    onEnviarEmailClick: async function(opcoes) {
        const view = this.getView();
        const empresaEnvio = configs.getEmpresa().id;

        const automatico = opcoes.automatico;

        if(automatico && view.tipo != 'MOVIMENTOS') {  // Enviar auto apenas notas eletronicas.
            return;
        }

        try {
            const tipo = view.tipo;
            let emailTransporte = '';
            let defaultEmail = '';
            let boletoAnexo = '';
            const model = this.getRecord();
            const idMovimento = model.get('MOVIMENTOS_ID');

            if(tipo == 'MOVIMENTOS') {
                const envio = model.get('MOVIMENTOS_ENVIO') || [];
                if(envio.length > 0) {
                    if(envio[0]['MOVIMENTOSENVIO_ID_TRANSPORTES'] == 121 && configs.getMovimentos().envioXMLTransportador) {
                        emailTransporte = envio[0]['TRANSPORTES_EMAIL'] || '';
                    }
                }

                if(configs.getFinanceiros().boletos.pix || configs.getMovimentos().envioAutomaticoBoleto) {
                    const boletos = (model.get('MOVIMENTOS_FINANCEIROS') || []).filter(boleto => Number(boleto.FINANCEIROS_ABERTO) > 0);
                    const idPortador = cents(model.get('PORTADORES_ID')) / 100;
                    if(boletos.length > 0) { //  && isBoleto
                        const ids = boletos.map(boleto => boleto['FINANCEIROS_ID']).join(',');                    
                        boletoAnexo = await this.gerarPDFBoletos(ids, idPortador);
                    }
                }
            }

            //Adiciona os emails se eles forem validos
            let emailA = (model.get('PESSOAS_EMAIL')  || '');
            let emailB = (model.get('PESSOAS_PAGINA') || '');
            let emailC = (model.get('PESSOAS_FANTASIA') || '');
            let emailD = (emailTransporte || '');
            let emailE = configs.getMovimentos().ccEmailPara ? (configs.getMovimentos().ccEmailPara[empresaEnvio] || '').toString() : '';
            let xmlsAnexos = ''
            let listaEmails = '';
            if( SamosUtils.String.isEmail(emailA)){ listaEmails += (emailA + ',') };
            if( SamosUtils.String.isEmail(emailB) && (emailB != emailA)){ listaEmails += (emailB + ',') };
            if( SamosUtils.String.isEmail(emailC) && (emailC != emailB)){ listaEmails += (emailC + ',') };
            if( SamosUtils.String.isEmail(emailD)){ listaEmails += (emailD + ',') };
            if( SamosUtils.String.isEmail(emailE)){ listaEmails += (emailE + ',') };

            defaultEmail = listaEmails.slice(0, -1);

            const emails = automatico ? defaultEmail : await SamosUtils.Msg.prompt('Email', 'Confirme ou digite o email:', defaultEmail);
            
            if(emails === false) { return; }//cancelado pelo usuario
            if(!automatico) { view.initGauge('Enviando XML por email...'); }

            const pdfAnexo   = await this.gerarPDF();

            xmlsAnexos = await this.getLinksXML();

            const nomeDocumento = tipo == 'MOVIMENTOS' ? 'Nota Eletrônica' : SamosUtils.String.toPascalCase(tipo.toLowerCase());
            const emissao = momentTz(model.get(tipo + '_EMISSAO')).format('DD/MM/YYYY');
            const valor = Ext.util.Format.MoneyMask.setMask('#9.999.990,00').mask(model.get(tipo + '_TOTAL'));
            const nomePessoa = model.get(tipo == 'MOVIMENTOS' ? 'MOVIMENTOS_NOME' : tipo == 'MANIFESTOS' ? 'TRANSPORTES_NOME' : 'PESSOAS_NOME');

            var cpfCnpj = SamosUtils.String.onlyNumbers(model.get(tipo + '_CPFCNPJ'));

            if (cpfCnpj.length == 11) {
                cpfCnpj = Ext.util.Format.TextMask.setMask('999.999.999-99', false).mask(cpfCnpj);                                            
            } else if (cpfCnpj.length == 14) {
                cpfCnpj = Ext.util.Format.TextMask.setMask('99.999.999/9999-99', false).mask(cpfCnpj);
            }
                                
            const cabecalho = `<table style="width:70%">
                <tr>
                <td width=10%><font size="3" color="back"><p>Emitente:</p></font></td>
                <td width=70%><font size="3" color="red"><p>${model.get('EMPRESAS_FANTASIA') || ''} ${Ext.util.Format.TextMask.setMask('99.999.999/9999-99').mask(model.get('EMPRESAS_CPFCNPJ'))}</p></font></td>
                <td width=20%></td>
                </tr>
                <tr>
                <td width=10%><font size="3" color="back"><p>Endere&ccedil;o:</p></font></td>
                <td width=70%><font size="3" color="red"><p>${model.get('EMPRESAS_ENDERECO') || ''}, ${model.get('EMPRESAS_NUMERO') || ''}, ${model.get('EMPRESAS_BAIRRO') || ''}, ${model.get('CIDADES_NOMEEMPRESA') || ''}, ${model.get('CIDADES_ESTADOEMPRESA') || ''}</p></font></td>
                <td width=20%></td>
                </tr>
            </table>
            <br>`;

            const corpo = `<table style="width:70%">
                <tr>
                    <td>
                    <font size="4" color="red"><p>Segue em anexo XML e PDF do documento ${nomeDocumento}</p></font>
                    <table border="1" style="width:100%;background-color: #c1ddf1;">
                        <tr>
                            <td class="tabcenter" width=45%><b>Destinatário </b></td>
                            <td class="tabcenter" width=23%><b>CPF/CNPJ     </b></td>
                            <td class="tabcenter" width=15%><b>Emissão      </b></td>
                            <td class="tabcenter" width=12%><b>Valor        </b></td>
                        </tr>
                        <tr>
                            <td class="tabcenter" width=45%><b>${nomePessoa}</b></td>
                            <td class="tabcenter" width=23%><b>${cpfCnpj}</b></td>
                            <td class="tabcenter" width=15%><b>${emissao}</b></td>
                            <td class="tabcenter" width=12%><b>${valor}  </b></td>
                        </tr>
                    </table>
                    </td>
                </tr>
            </table>`;

            if((configs.getMovimentos().envioEmail || '') == 'delphi') {
                if(boletoAnexo) {
                    await SamosUtils.Request.delphi('GET', {
                        type       : 'notaeletronica',
                        method     : 'enviaremail',
                        idMovimento: idMovimento,
                        Emails     : emails,
                        anexos     : (pdfAnexo + ',' + boletoAnexo)
                    })            
                } else {
                    await SamosUtils.Request.delphi('GET', {
                        type       : 'notaeletronica',
                        method     : 'enviaremail',
                        idMovimento: idMovimento,
                        Emails     : emails,
                        anexos     : pdfAnexo
                    })
                }    
            } else { // O que já era usado, no nodejs
                if(boletoAnexo) {
                    await SamosUtils.Email.enviar({
                        emails:      emails,
                        assunto:     `${configs.getEmpresa().nome} - Anexo ${nomeDocumento} emitida para seu CPF/CNPJ ${cpfCnpj}`,
                        template:    'resources/email.html',
                        cabecalho:   cabecalho,
                        corpo:       corpo,
                        anexos:      [pdfAnexo, ...xmlsAnexos, boletoAnexo]
                    });    
                } else {
                    await SamosUtils.Email.enviar({
                        emails:      emails,
                        assunto:     `${configs.getEmpresa().nome} - Anexo ${nomeDocumento} emitida para seu CPF/CNPJ ${cpfCnpj}`,
                        template:    'resources/email.html',
                        cabecalho:   cabecalho,
                        corpo:       corpo,
                        anexos:      [pdfAnexo, ...xmlsAnexos]
                    });
                }
            }

            Ext.Note('success', 'Email/XML enviado com sucesso');

        } catch(error) {
            if(!automatico)  {
                this.showResults('Falha ao enviar email com XML');
                SamosUtils.Msg.error(error, 'Falha ao enviar email com XML');
            }
        }

        view.stopGauge(true);
    },

    getLinksXML: async function() {
        const tipo = this.getView().tipo;
        const id = this.getRecord().get(tipo + '_ID');
        const guidXml = SamosUtils.String.gerarGuid();
        let queryXML = await SamosUtils.Request.nodeApi({
                        url: `/processos/movimentos/enviosefaztxt`,
                        method: 'POST',
                        data: {
                            type  : tipo == 'MOVIMENTOS' ? 'notaeletronica' : tipo.toLowerCase(),
                            method: 'email',
                            id    : id,
                            guid  : guidXml
                        }
                    });    
    
        if(!queryXML[0]['retorno']){
            throw 'XML não encontrado';
        }    

        const queryGravarXMLEnvio = await SamosUtils.Request.nodeApi({
            url: `/processos/gravaarquivo`,
            method: 'POST',
            data: {
                nomeArquivo: queryXML[0]['caminho'],
                conteudo   : queryXML[0]['retorno']
            }
        });

        let xmlEnvio = queryGravarXMLEnvio.results;
        let xmlCancelamento = null;

        if(!(queryXML[0]['status'] || '').match(/Enviado com sucesso/) && (queryXML[0]['status'] || '').match(/xml/)){
            const queryGravarXMLCancelamento = await SamosUtils.Request.nodeApi({
                url: `/processos/gravaarquivo`,
                method: 'POST',
                data: {
                    nomeArquivo: queryXML[0]['caminho'].replace('nfe', 'can'),
                    conteudo   : queryXML[0]['status']//xml de cancalemento
                }
            });

            xmlCancelamento = queryGravarXMLCancelamento.results
        }    

        return xmlCancelamento ? [xmlEnvio, xmlCancelamento] : [xmlEnvio];
    },

    onEncerramentoClick: async function(btn, e) {
        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente encerrar?')) {
                view.initGauge();
                await this.chamadaSefazTXT('encerramento');
            }
        } catch(error) {
            this.showResults('Falha ao encerrar');
            SamosUtils.Msg.error(error, 'Falha ao encerrar');
        }

        view.stopGauge();
    },

    onCartasdeCorrecaoClick: function(btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const movimento     = this.getViewModel().get('model');
        const dataCartas    = movimento.get('MOVIMENTOS_CARTAS');
        const listCartas    = Ext.create({
            xtype: 'formmovimentossefazcartas'
        });

        listCartas.getViewModel().set({
            movimento: movimento,
            dataCartas: dataCartas
        });

        listCartas.focus();
        formMovimento.add(listCartas);
    },

    onCancelamentoClick: async function(btn, e) {
        const view = this.getView();
        const vm = this.getViewModel();

        const hoje = momentServer().hours(0).minutes(0).seconds(0);
        const emissao = momentTz(vm.get('model.MOVIMENTOS_EMISSAO')).hours(0).minutes(0).seconds(0);
        const corpoCancelamento = `Solicitando liberação para cancelamento da NF-e: ${vm.get('model.MOVIMENTOS_NUMERO')} ${vm.get('model.MOVIMENTOS_SERIE')} - Emissão: ${momentTz(vm.get('model.MOVIMENTOS_EMISSAO')).format('DD/MM/YYYY')} - Pessoa: ${vm.get('model.MOVIMENTOS_NOME')}`
        const limite = momentTz(emissao).add(1, 'days');
        const dentroPermitido = (momentTz(limite.format()).isSameOrAfter(hoje) || configs.getUsuario().privilegiado);

        if(!dentroPermitido && configs.getUsuario().id != 1) {
            Ext.Note('warning', 'Cancelando nota fiscal fora do prazo permitido - contate suporte');
            return;
        }   

        if(!configs.getUsuario().privilegiado) {
            if(configs.getMovimentos().liberacaoViaSocket) {
                try {
                    await SamosWidgets.SolicitaSocket.solicitar({
                        operadorId: `${configs.getClientName()}${configs.getUsuario().id}`,
                        operadorNome: configs.getUsuario().nome,       
                        titulo: 'Autorização para Cancelamento',           
                        mensagem: 'Aguardando autorização para Cancelar...',
                        corpo: corpoCancelamento
                    });    
                } catch (erro) {
                    console.log(erro);
                    Ext.Note('warning', 'Não autorizado');            
                    return;            
                }    
            } else {
                try {
                    await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(3);
                } catch(error) {
                    console.log(error);
                    Ext.Note('warning', 'Não autorizado');            
                    return;
                }    
            }
        }

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente cancelar?')) {
                view.initGauge();
                await this.chamadaSefazTXT('cancelar');
                await this.chamadaSefazTXT('consultar');    
            }
        } catch(error) {
            this.showResults('Falha ao cancelar');
            SamosUtils.Msg.error(error, 'Falha ao cancelar');
        }

        view.stopGauge();
    },

    onInutilizarClick: function(btn, e) {
        const movimento = this.getRecord();

        const win = Ext.create({
            xtype: 'window',
            title: 'Inutilizar Numeração',
            autoShow: true,
            width: 200,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            bodyPadding: 10,
            items: [
                {
//                    width: 95,
                    flex: 1,
                    xtype: 'numberfield',
                    hideTrigger: true,
                    fieldLabel: 'Número',
                    reference: 'numeroinutilizar',
                    enableKeyEvents: true,
                    decimalPrecision: 0,
                    hideTrigger: true,
                    fieldStyle: {
                        textAlign: 'right',
                        color: 'red'
                    },
                    value: movimento.get('MOVIMENTOS_NUMERO')
                },
                {
                    xtype: 'container',
                    layout: {
                        type: 'hbox',
                        align: 'center',
                        pack: 'center'
                    },
                    items: [
                        {
                            fieldLabel: 'Mês',
                            xtype: 'combobox',
                            reference: 'mesinutilizar',
                            width: 130,
                            store: [
                                ['01', 'Janeiro'],
                                ['02', 'Fevereiro'],
                                ['03', 'Março'],
                                ['04', 'Abril'],
                                ['05', 'Maio'],
                                ['06', 'Junho'],
                                ['07', 'Julho'],
                                ['08', 'Agosto'],
                                ['09', 'Setembro'],
                                ['10', 'Outubro'],
                                ['11', 'Novembro'],
                                ['12', 'Dezembro']
                            ],
                            value: momentServer().subtract(1, 'month').format('MM')
                        },
                        {
                            width: 45,
                            xtype: 'numberfield',
                            hideTrigger: true,
                            fieldLabel: 'Ano',
                            reference: 'anoinutilizar',
                            enableKeyEvents: true,
                            decimalPrecision: 0,
                            hideTrigger: true,
                            fieldStyle: {
                                textAlign: 'right',
                                color: 'red'
                            },
                            value: momentServer().subtract(1, 'month').format('YYYY')
                        }            
                    ]
                },
                {
                    xtype: 'container',
                    layout: {
                        type: 'hbox',
                        align: 'center',
                        pack: 'center'
                    },
                    items: [
                        {
                            xtype: 'button',
                            text: 'Inutilizar',
                            margin: '10 7 7 7',
                            ui: `primary-${configs.getTema()}`,
                            handler: inutilizar
                        },
                        {
                            xtype: 'button',
                            text: 'Sair',
                            margin: '10 7 7 0',
                            ui: `tertiary-${configs.getTema()}`,
                            handler: function() {
                                win.destroy();
                            }
                        }
                    ]
                }
            ]
        });

        async function inutilizar() {
            try {
               
                win.initGauge();

                const numeroInutilizar = win.down('[reference=numeroinutilizar]').getValue();
                const mesInutilizar    = win.down('[reference=mesinutilizar]').getValue();
                const anoInutilizar    = win.down('[reference=anoinutilizar]').getValue();
                const serieInutilizar  = movimento.get('MOVIMENTOS_SERIE');
                const guidInutilizar   = SamosUtils.String.gerarGuid();

                console.log('inutilizar: ', numeroInutilizar);
                console.log('mês: ', mesInutilizar);
                console.log('ano: ', anoInutilizar);
                console.log('guid: ', guidInutilizar);

                if(parseInt(numeroInutilizar) == 0) {
                    Ext.Note('warning', 'Número a inutilizar não informado');
                    win.stopGauge(true);                    
                    return;
                }

                if(numeroInutilizar == movimento.get('MOVIMENTOS_NUMERO')) {
                    if(movimento.get('MOVIMENTOS_PROTOCOLO').trim().length > 0) {
                        Ext.Note('warning', 'Nota Eletrônica transmitida - não permitido');
                        win.stopGauge(true);                    
                        return;
                    }
                    if(moment(movimento.get('MOVIMENTOS_EMISSAO')).isSameOrAfter(moment().startOf('month'))) {
                        Ext.Note('warning', 'Nota Eletrônica emitida no mês atual ou posterior - não permitido');
                        win.stopGauge(true);                    
                        return;
                    }
                }

                if(parseInt(mesInutilizar) == 0) {
                    Ext.Note('warning', 'Mês de referência não informado');
                    win.stopGauge(true);                    
                    return;
                }

                if(parseInt(anoInutilizar) == 0) {
                    Ext.Note('warning', 'Ano de referência não informado');
                    win.stopGauge(true);                    
                    return;
                }

                if(await SamosUtils.Msg.confirm('Deseja realmente Inutilizar essa numeração?')) {
                    const reqInutilizar = await SamosUtils.Request.nodeApi({
                        url: `/processos/movimentos/inutilizar/${numeroInutilizar.toString()}`,
                        method: 'PUT',
                        data: {
                            'serieReferencia' : serieInutilizar,
                            'mesReferencia'   : mesInutilizar,
                            'anoReferencia'   : anoInutilizar,
                            'guid'            : guidInutilizar
                        }
                    });

                    console.log('resposta do reqInutilizar: ', reqInutilizar);

                    Ext.Note('success', 'Inutilização efetuada com sucesso');
                }
                win.destroy();
            } catch(error) {
                win.stopGauge(true);
                SamosUtils.Msg.error(error, 'Falha ao inutilizar numeração');
            }
        }
    },

    onRecusadaClick: async function(btn, e) {
        const view = this.getView();
        const model = this.getRecord();
        
        try {
            const movimento   = this.getRecord();
            const idMovimento = movimento.get('MOVIMENTOS_ID');

            if(await SamosUtils.Msg.confirm('Confirma a recusa pelo destinatário?')) {
                view.initGauge();

                await SamosUtils.Request.nodeApi({
                    url: `/processos/movimentos/recusa/${idMovimento}`,
                    method: 'PUT'
                });

                model.set({
                    'MOVIMENTOS_STATUS'      : 'R',
                    'MOVIMENTOS_LOG'            : SamosUtils.Info.getLog(),
                    'MOVIMENTOS_ENTRADASAIDA'   : '1899-12-30',
                    'MOVIMENTOS_OBSERVACOES'    : `RECUSADA||||||||||`
                });

                Ext.Note('success', 'Recusa confirmada');
            }
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao confirmar recusa');
        }

        view.stopGauge();
    },

    onDevolvidaClick: async function(btn, e) {
        const view = this.getView();
        const model = this.getRecord();
        
        try {
            const movimento   = this.getRecord();
            const idMovimento = movimento.get('MOVIMENTOS_ID');

            if(await SamosUtils.Msg.confirm('Confirma a devolução pelo destinatário?')) {
                view.initGauge();

                await SamosUtils.Request.nodeApi({
                    url: `/processos/movimentos/devolucao/${idMovimento}`,
                    method: 'PUT'
                });

                model.set({
                    'MOVIMENTOS_STATUS'         : 'V',
                    'MOVIMENTOS_LOG'            : SamosUtils.Info.getLog(),
                    'MOVIMENTOS_ENTRADASAIDA'   : '1899-12-30',
                    'MOVIMENTOS_OBSERVACOES'    : `DEVOLVIDA||||||||||`
                });

                Ext.Note('success', 'Devolução confirmada');
            }
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao confirmar devolução');
        }

        view.stopGauge();
    },

    getNumeroCaixa: async function() {
        const numeroCaixa = await SamosUtils.Msg.prompt('Email', 'Digite o número do caixa em operação', '');
            
        if(numeroCaixa === false) { //cancelado pelo usuario
            Ext.Note('warning', 'Informe o número do caixa');
            return await this.getNumeroCaixa();
        } else {
            localStorage.setItem('numeroCaixa', numeroCaixa);
            return numeroCaixa
        }
    },

    chamadaSefazPadrao: async function(method, email = '') {
        const tipo = this.getView().tipo;
        const id   = this.getRecord().get(tipo + '_ID');

        const type = tipo == 'MOVIMENTOS' ? 'notaeletronica' :
                     tipo == 'ORDENS'     ? 'notaservico'    :  tipo.toLowerCase();
        
        const querySefaz = await SamosUtils.Request.delphi('GET', {
            type    : type,
            method  : method,
            id      : id,
            email   : email
        });

        return this.handleAnswer(querySefaz, method);
    },

    chamadaSefazTXT: async function(method) {
        const tipo = this.getView().tipo;
        const id   = this.getRecord().get(tipo + '_ID');

        const guidSefaz = SamosUtils.String.gerarGuid();

        const type = tipo == 'MOVIMENTOS' ? 'notaeletronica' :
                     tipo == 'ORDENS'     ? 'notaservico'    :  tipo.toLowerCase();
        

        const querySefaz = await SamosUtils.Request.nodeApi({
                                url: `/processos/movimentos/enviosefaztxt`,
                                method: 'POST',
                                data: {
                                    type  : type,
                                    method: method,
                                    id    : id,
                                    guid  : guidSefaz
                                }
                           });

        return this.handleAnswer(querySefaz, method);
    },

    handleAnswer: function (querySefaz, method) {
        const tipo = this.getView().tipo;
        const movimento = this.getRecord();
        const record = querySefaz[0];
        const xml = SamosUtils.String.beautifyXml(record.data['retorno'] || record.data['status'], 4).trim();
        const path = record.data['caminho'];
        const protocolo = record.data['protocolo'];
        const chave = record.data['nfe'];

        //Checar o vencimento do certificado A1
        if( record.data['validade'] ){
            const dataValidadeSplitBR = record.data['validade'].split('/');
            const dia = dataValidadeSplitBR[0];
            const mes = dataValidadeSplitBR[1];
            const ano = dataValidadeSplitBR[2];
            const dataMomentAmericana = moment(`${ano}-${mes}-${dia}`);
            const diasParaVencer = Math.abs( dataMomentAmericana.diff( moment(), 'days' ) );
            const mensagemCertificado = `Restam ${ diasParaVencer } dias para vencer o Certificado A1`;
            
            if( diasParaVencer <= 14 )
            {
                this.getView().setTitle(`SEFAZ (${ String(mensagemCertificado) })`);
            }

            if( diasParaVencer <= 5 )
            {
                Ext.defer( ()=>{
                    SamosUtils.Msg.alert('Aviso de vencimento de certificado A1', mensagemCertificado); 
                }, 600, this );
            }

        }   

        if(method == 'enviar' && protocolo && chave && record.data['retorno'].match(/xml/)) {
            this.xml = record.data['retorno'];//para enviar para vtex
        } else {
            this.xml = null;
        }

        delete record.data['caminho'];
        delete record.data['id'];

        if(protocolo){
            this.getViewModel().set('hasProtocolo', true);
            movimento.set(tipo + '_PROTOCOLO', protocolo);

            if( 
                method == 'enviar' && 
                movimento.get('DOCUMENTOS_NOME') == 'Nota Eletrônica' 
            ){
               //Ja que veio protocolo, coloca o status para faturado
               movimento.set(tipo + '_STATUS', 'F');
            }
        }
        
        //Se for um encerramento de um manifesto
        if( method == 'encerramento' && tipo == 'MANIFESTOS' ){
            //coloca o status para Encerrado
            movimento.set(tipo + '_STATUS', 'R');
        }

        //Se estiver consultando um manifesto
        if( 
            (method == 'consultar' || method == 'status') &&
            tipo == 'MANIFESTOS'
        ){
            //Se existe a palavra "Encerramento", ele vai definir como encerrado tambem
            if( xml.indexOf('Encerramento') != -1 )
            {
                //coloca o status para Encerrado
                movimento.set(tipo + '_STATUS', 'F');
            }
        }

        if(record.data['nfe']){
            movimento.set(tipo + '_NFE', record.data['nfe']);
        } else if(record.data['cfe']){
            movimento.set(tipo + '_NFE', record.data['cfe']);
        }

        const respostaAlinhada = Object.keys(record.data)
            .reduce((rec, key) => {
                const chaveAlinhada = SamosUtils.String.completeChars(key, 12, ' ', 'rigth');
                rec[chaveAlinhada]  = (record.data[key] || '').toString().match(/1899/) ? '' : record.data[key];
                return rec;
            }, {});
        
        const txt = JSON.stringify(respostaAlinhada).slice(1,-1)
            .replace(/","/g, '\n')
            .replace(/,"/g, '\n')
            .replace(/",/g, '\n')
            .replace(/"/g, '')
            .replace(/:/g, ': ');

        this.showResults(txt, xml, record.data['status']);
        return path;
    },

    showResults: function(txt = '', xml = '', status) {
        const retStatus = SamosUtils.String.beautifyXml(status);
        this.getViewModel().set({
            respostaTxt: txt,
            respostaXml: retStatus || xml
        });
    },
    
    onOpcoesClick: Ext.emptyFn
});
