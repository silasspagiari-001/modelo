Ext.define('SamosAdmin.movimentos.movimento.form.sefaz.cartas.form.ViewController', {
    extend: 'SamosAdmin.movimentos.movimento.form.ViewController',
    alias: 'controller.formmovimentossefazformcartas',

    onNovoClick: async function(btn, event) {
        const formCartas = this.getView();
        const formMovimento = formCartas.up('formmovimentos');
        const listView = formMovimento.down('formmovimentossefazcartas');   
        const previousModel = this.getRecord();
        const newModel = Ext.create(listView.modelName || this.$className.replace(/\.[a-z]*\.ViewController/, '.Model'));

        newModel.set(newModel.getIdProperty(), 0);
        this.cleanChilds();

        formCartas.getViewModel().set({
            'model':         newModel,
            'initialValues': previousModel ? previousModel.getData() : {},
            'readOnly':      false,
            'previousModel': previousModel,
            'editionClosed': !formCartas.down('button[text="Fechar"]')
        });

        this.lookup('correcoes').setValue('');
        this.doDefaultFocus();        
        return formCartas;
    },

    onAlterarClick: function (btn, event) {
        this.setReadOnly(false);
        this.doDefaultFocus();
    },

    onExcluirClick: function (btn, event) {
        const formMovimento = Ext.$('formmovimentos')[0];
        const movimento = formMovimento.getViewModel().get('model');
        const storeCartas = formMovimento.down('formmovimentossefazcartas').getViewModel().get('main');   
        const modelCartas = this.getRecord();
        
        if(!this.permiteExclusao && !configs.getUsuario().privilegiado){
            const nivel = 1;

            Ext.create({ xtype: 'samoswidgets-senhanivel' })
                .iniciar(nivel)
                .then(() => {
                    this.permiteExclusao = true;
                    model.getProxy().setExtraParam('senhaNivel', 'true');
                    this.onExcluirClick();
                })
                .catch(() => {/*acao ao sair*/});
        } else {
            delete this.permiteExclusao;
            
            Ext.Msg.confirmDelete(btn => {
                if (btn == 'yes') {
                    storeCartas.remove(modelCartas);

                    movimento.set({
                        'MOVIMENTOS_CARTAS': storeCartas.getData().items.map(carta => carta.data)
                    });

                    this.getView().initGauge('Gravando...');
                    this.colocarFilhosNoModel(movimento);

                    movimento.save()
                        .then(() => {
                            Ext.Note('success', 'Carta excluída');
                            this.onSairClick();
                        })
                        .catch(this.onGravacaoFalha.bind(this));
                }
            });
        }
    },

    onGravarClick: function(btn, e) {

        const formMovimento = Ext.$('formmovimentos')[0];
        const movimento = formMovimento.getViewModel().get('model');
        const storeCartas = formMovimento.down('formmovimentossefazcartas').getViewModel().get('main');   
        const modelCartas = this.getRecord();
        
        this.validarCabecalho()
            .then(() => {
                Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
                    if (btn == 'yes') {
                        storeCartas.add(modelCartas);
    
                        for(let j in modelCartas.data){
                            if(j.match(/_EMISSAO/) || j.match(/_ENVIO/)) {
                                modelCartas.set(j, momentTz(modelCartas.get(j)).format('YYYY-MM-DD'));
                            }
                        }
    
                        movimento.set({
                            'MOVIMENTOS_CARTAS': storeCartas.getData().items.map(carta => carta.data)
                        });
    
                        this.getView().initGauge('Gravando...');
                        this.colocarFilhosNoModel(movimento);
    
                        movimento.save()
                            .then(() => {
                                Ext.Note('success', 'Carta salva');
                                this.onSairClick();
                            })
                            .catch(this.onGravacaoFalha.bind(this))
                            .finally(this.aposGravar.bind(this));
                    }
                });
            });
    },

    onEmailClick: async function() {
        const view = this.getView();

        try {
            const formMovimento = Ext.$('formmovimentos')[0];
            const movimento     = formMovimento.getViewModel().get('model');
            const defaultEmail  = movimento.get('MOVIMENTOS_EMAIL');
            const idCarta       = this.getRecord().get('MOVIMENTOSCARTAS_ID');
    
            const emails = await SamosUtils.Msg.prompt('Email', 'Confirme ou digite o email:', defaultEmail);
            
            if(emails === false) { return; }//cancelado pelo usuario
    
            if(!SamosUtils.String.isEmail(emails)) {
                throw 'Email inválido';
            }
    
            view.initGauge('Enviando email...');
    
            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/docsfiscais/${configs.getClientName()}/ccnfe/${idCarta}`,
                method: 'GET'
            });

            const pdfAnexo = queryPDF.results[0]['name'];
            const xmlAnexo = await this.getLinkXML(idCarta);
            
            let cpfCnpj    = movimento.get('MOVIMENTOS_CPFCNPJ');
            const emissao  = momentTz(movimento.get('MOVIMENTOS_EMISSAO')).format('DD/MM/YYYY');
            const valor    = Ext.util.Format.MoneyMask.setMask('#9.999.990,00').mask(movimento.get('MOVIMENTOS_TOTAL'));

            if (cpfCnpj.length == 11) {
                cpfCnpj = Ext.util.Format.TextMask.setMask('999.999.999-99', false).mask(cpfCnpj);                                            
            } else if (cpfCnpj.length == 14) {
                cpfCnpj = Ext.util.Format.TextMask.setMask('99.999.999/9999-99', false).mask(cpfCnpj);
            }
                                
            const cabecalho = `<table style="width:70%">
                <tr>
                <td width=10%><font size="3" color="back"><p>Emitente:</p></font></td>
                <td width=70%><font size="3" color="red"><p>${movimento.get('EMPRESAS_FANTASIA') || ''} ${Ext.util.Format.TextMask.setMask('99.999.999/9999-99').mask(movimento.get('EMPRESAS_CPFCNPJ'))}</p></font></td>
                <td width=20%></td>
                </tr>
                <tr>
                <td width=10%><font size="3" color="back"><p>Endere&ccedil;o:</p></font></td>
                <td width=70%><font size="3" color="red"><p>${movimento.get('EMPRESAS_ENDERECO') || ''}, ${movimento.get('EMPRESAS_NUMERO') || ''}, ${movimento.get('EMPRESAS_BAIRRO') || ''}, ${movimento.get('EMPRESAS_CIDADES') || ''}, ${movimento.get('EMPRESAS_ESTADO') || ''}</p></font></td>
                <td width=20%></td>
                </tr>
            </table>
            <br>`;

            const corpo = `<table style="width:70%">
                <tr>
                    <td>
                    <font size="4" color="red"><p>Segue em anexo XML e PDF de sua Carta de Correção</p></font>
                    <table border="1" style="width:100%;background-color: #c1ddf1;">
                        <tr>
                            <td class="tabcenter" width=45%><b>Destinatário </b></td>
                            <td class="tabcenter" width=23%><b>CPF/CNPJ     </b></td>
                            <td class="tabcenter" width=15%><b>Emissão      </b></td>
                            <td class="tabcenter" width=12%><b>Valor        </b></td>
                        </tr>
                        <tr>
                            <td class="tabcenter" width=45%><b>${movimento.get('MOVIMENTOS_NOME')}</b></td>
                            <td class="tabcenter" width=23%><b>${cpfCnpj}</b></td>
                            <td class="tabcenter" width=15%><b>${emissao}</b></td>
                            <td class="tabcenter" width=12%><b>${valor}  </b></td>
                        </tr>
                    </table>
                    </td>
                </tr>
            </table>`;

            await SamosUtils.Email.enviar({
                emails:      emails,
                assunto:     `${configs.getEmpresa().nome} - Anexo Carta de Correção emitida para seu CPF/CNPJ ${cpfCnpj}`,
                template:    'resources/email.html',
                cabecalho:   cabecalho,
                corpo:       corpo,
                anexos:      [pdfAnexo, xmlAnexo]
            });

            Ext.Note('success', 'Email enviado com sucesso');
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao enviar email');
        }

        view.stopGauge();
    },

    getLinkXML: async function(idCarta) {
        const idMovimento = this.getRecord().get('MOVIMENTOSCARTAS_ID_MOVIMENTOS');
        const guidXml = SamosUtils.String.gerarGuid();
        let queryXML = await SamosUtils.Request.nodeApi({
                        url: `/processos/movimentos/enviosefaztxt`,
                        method: 'POST',
                        data: {
                            type       : 'notaeletronica',
                            method     : 'emailcorrecao',
                            idMovimento: idMovimento,
                            idCarta    : idCarta,
                            guid       : guidXml
                        }
                    });

        if(!queryXML[0].data['retorno']){
            throw 'XML não encontrado';
        }    

        let nomeArquivoRetorno = `${queryXML[0].data['nfe']}_${queryXML[0].data['protocolo']}-cce.xml`;

        const queryGravarXML = await SamosUtils.Request.nodeApi({
            url: `/processos/gravaarquivo`,
            method: 'POST',
            data: {
                nomeArquivo: nomeArquivoRetorno,
                conteudo   : queryXML[0].data['retorno']//xml de envio
            }
        });

        return queryGravarXML.results;
    },

    onEnviarClick: async function (btn, e) {
        const view = this.getView();

        try {
            const vm            = this.getViewModel();
            const formMovimento = Ext.$('formmovimentos')[0];
            const movimento     = formMovimento.getViewModel().get('model');
            const modelCartas   = this.getRecord();
            const storeCartas   = formMovimento.down('formmovimentossefazcartas').getViewModel().get('main');
            
            if(await SamosUtils.Msg.confirm('Deseja realmente enviar?')) {
                view.initGauge('Enviando...');

                const guidCarta = SamosUtils.String.gerarGuid();

                let queryCarta = await SamosUtils.Request.nodeApi({
                    url: `/processos/movimentos/enviosefaztxt`,
                    method: 'POST',
                    data: {
                        type       : 'notaeletronica',
                        method     : 'correcao',
                        idMovimento: movimento.get('MOVIMENTOS_ID'),
                        idCarta    : this.getRecord().get('MOVIMENTOSCARTAS_ID'),                            
                        guid       : guidCarta
                    }
                });
    
                vm.set('showXmlView', true);
                this.handleAnswer(queryCarta);
    
                modelCartas.set({
                    'MOVIMENTOSCARTAS_ENVIO':     momentServer().format('YYYY-MM-DD'),
                    'MOVIMENTOSCARTAS_HORA':      momentServer().format('HH:mm:ss'),
                    'MOVIMENTOSCARTAS_NOME':      vm.get('model.MOVIMENTOSCARTAS_NOME'),
                    'MOVIMENTOSCARTAS_PROTOCOLO': queryCarta[0].get('PROTOCOLO') || queryCarta[0].get('protocolo'),
                    'MOVIMENTOSCARTAS_STATUS':    'T'
                });
    
                movimento.set({
                    'MOVIMENTOS_CARTAS': storeCartas.getData().items.map(carta => carta.data)
                });
            }
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao enviar');
        }

        view.stopGauge();
    },

    onEmitirClick: async function (btn, e) {
        const view = this.getView();
        
        try {
            view.initGauge();

            const model = this.getRecord();
            const id    = model.get('MOVIMENTOSCARTAS_ID')

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/docsfiscais/${configs.getClientName()}/ccnfe/${id}`,
                method: 'GET'
            });

            view.stopGauge(true);
            
            await SamosUtils.Utils.sleep(600);

            SamosUtils.Pdf.exibir({
                local: 'window',
                caminho: queryPDF.results[0]['name'], 
                serverType: 'nodejs'
            });
        } catch (error) {
            view.stopGauge(true);
            SamosUtils.Msg.error(error, 'Falha ao emitir carta de correção');
        }
    },

    handleAnswer: function (queryCarta) {
        const record = queryCarta[0];
        const xml    = SamosUtils.String.beautifyXml(record.get('status'), 4);
        const path   = record.get('caminho');

        delete record.data['status'];
        delete record.data['caminho'];
        delete record.data['id'];

        const respostaAlinhada = Object.keys(record.data)
            .reduce((rec, key) => {
                const chaveAlinhada = SamosUtils.String.completeChars(key, 12, ' ', 'right');
                rec[chaveAlinhada] = (record.data[key] || '').toString().match(/1899-12/) ? '' : record.data[key];
                return rec;
            }, {});
        
        const txt = JSON.stringify(respostaAlinhada).slice(1,-1)
            .replace(/","/g, '\n')
            .replace(/,"/g, '\n')
            .replace(/",/g, '\n')
            .replace(/"/g, '')
            .replace(/:/g, ': ');

        this.showResults(txt, xml);
        return path;
    },

    showResults: function(txt = '', xml = '') {
        this.getViewModel().set({
            respostaTxt: txt,
            respostaXml: xml
        });
    }
});
