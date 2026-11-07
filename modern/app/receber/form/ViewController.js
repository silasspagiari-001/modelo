Ext.define('SamosAdminModern.receber.form.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.receberform',

    showButtons: function() {
        const main = this.getView().up('main');
        main.down('image[reference="logo"]').hide();
    },

    onVoltarClick: function() {
        const main = this.getView().up('main');

        main.down('panel').setActiveItem('receber');
        main.down('container[reference="title"]').setHtml('Financeiro');

        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        });

        Ext.defer(() => {
            this.getView().query('field')
                .map(field => {
                    try { field.el.dom.querySelector('input').style.backgroundColor = 'transparent' } catch (e) {}
                })
        }, 100)
    },

    onWhatsappClick: async function() {
        const view  = this.getView();
        const record = this.getViewModel().get('model');

        if(!record.get('FINANCEIROS_NOSSONUMERO')) {
            return SamosUtils.Msg.alert('Atenção', 'Boleto sem nosso número');
        }

        if(!(record.get('FINANCEIROS_EXPORTADO') || '').match(/T|E/ig)) {
            return SamosUtils.Msg.alert('Atenção', 'Boleto não enviado para o banco');
        }

        if(!(record.get('FINANCEIROS_STATUS') || '').match(/A/ig)) {
            return SamosUtils.Msg.alert('Atenção', 'Boleto pago');
        }

        let cleanedNumber;

        if(!(/iPhone/.test(navigator.userAgent))) {
            const numero = await SamosUtils.Msg.prompt({
                title       : 'WhatsApp',
                mensagem    : 'Digite ou confirme o número:',
                initialValue: record.get('PESSOAS_CELULAR') || record.get('PESSOAS_CELULARCOBRANCA') || record.get('PESSOAS_TELEFONE'),
                field       : { upperCased: false }
            });
    
            if(numero === false) { return; }
    
            cleanedNumber = SamosUtils.String.onlyNumbers(numero).replace(/^0/, '');
            
            if(!SamosUtils.String.isTelefoneOuCelular(cleanedNumber)){
                return SamosUtils.Msg.alert('Atenção', 'O número informado é inválido');
            }
        }

        view.initGauge('Gerando link para Whatsapp...');

        const layBoleto = configs.getFinanceiros().boletos.pix ? 'boletospix' : 'boletos';
        
        try {
            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/${layBoleto}`,
                method: 'GET',
                data: {
                    ids: [record.get('FINANCEIROS_ID')],
                    empresa: configs.getEmpresa().id,
                    portador: record.get('FINANCEIROS_ID_PORTADOR')   
                }
            });

            await SamosUtils.Utils.sleep(500);

            const pdf    = queryPDF.results[0]['name']
            const pdfUrl = configs.getApiNode() + '/' + pdf;

            if(/iPhone/.test(navigator.userAgent)) {
                view.stopGauge();
                
                await SamosUtils.Msg.prompt({
                    title       : 'WhatsApp',
                    mensagem    : 'Copie o link e cole no WhatsApp',
                    initialValue: pdfUrl.replace('https://', '')
                });
            } else {
                const texto  =  `Baixe aqui seu boleto: ${pdfUrl}`;
                const url = `whatsapp://send?phone=55${cleanedNumber}&text=${window.encodeURIComponent(texto)}`
                window.open(url, '_blank');
            }

            if(configs.getClientName() == 'automacao') {  // Na automação
                Ext.asap(() => {                          //atualiza silenciosamente o FINANCEIROS_EXPORTADO para E (Emitido)
                    SamosUtils.Request.nodeApi({
                        url: `/processos/financeiros/atualizarstatus`,
                        method: 'POST',
                        data:[{
                            'FINANCEIROS_ID'       : record.get('FINANCEIROS_ID'),
                            'FINANCEIROS_EXPORTADO': 'E',//Emitido
                        }]
                    });
                });
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao gerar boleto');
        }

        view.stopGauge();
    },

    onEmailClick: async function(btn, e) {
        const view  = this.getView();
        const record = this.getViewModel().get('model');

        if(!record.get('FINANCEIROS_NOSSONUMERO')) {
            return SamosUtils.Msg.alert('Atenção', 'Boleto sem nosso número');
        }

        if(!(record.get('FINANCEIROS_EXPORTADO') || '').match(/T|E/ig)) {
            return SamosUtils.Msg.alert('Atenção', 'Boleto não enviado para o banco');
        }

        if(!(record.get('FINANCEIROS_STATUS') || '').match(/A/ig)) {
            return SamosUtils.Msg.alert('Atenção', 'Boleto pago');
        }

        try {
            const titulos = [this.getViewModel().get('model')]
            const defaultEmail = record.get('PESSOAS_EMAIL');
            const emails = await SamosUtils.Msg.prompt({
                title: 'Email', 
                message: 'Confirme ou digite o email:', 
                initialValue: defaultEmail,
                field : { upperCased: false }
            });
    
            if(emails === false) { return; }//cancelado pelo usuario
    
            if(!SamosUtils.String.isEmail(emails)) {
                throw 'Email inválido';
            }
            
            view.initGauge('Enviando email...');
    
            const ids = record.get('FINANCEIROS_ID');

            const layBoleto = configs.getFinanceiros().boletos.pix ? 'boletospix' : 'boletos';

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/${layBoleto}`,
                method: 'GET',
                data: {
                    ids: ids,
                    empresa: configs.getEmpresa().id,
                    portador: this.getViewModel().get('valueIdPortador')    
                }
            })

            const pdfAnexo = queryPDF.results[0]['name'];
            const cabecalho = `<table style="width:70%">
                <tr>
                <td width=10%><font size="3" color="back"><p>Emitente:</p></font></td>
                <td width=70%><font size="3" color="red"><p>${record.get('EMPRESAS_FANTASIA')} ${Ext.util.Format.TextMask.setMask('99.999.999/9999-99').mask(record.get('EMPRESAS_CPFCNPJ'))} ${record.get('EMPRESAS_TELEFONE')}</p></font></td>
                <td width=20%></td>
                </tr>
                <tr>
                <td width=10%><font size="3" color="back"><p>Endere&ccedil;o:</p></font></td>
                <td width=70%><font size="3" color="red"><p>${record.get('EMPRESAS_ENDERECO')}, ${record.get('EMPRESAS_NUMERO')}, ${record.get('EMPRESAS_BAIRRO')}, ${record.get('EMPRESAS_CIDADES')}, ${record.get('EMPRESAS_ESTADO')}</p></font></td>
                <td width=20%></td>
                </tr>
            </table>
            <br>`;

            let cpfCnpj = record.get('PESSOAS_CPFCNPJ');
            const vcto  = momentTz(record.get('FINANCEIROS_VENCIMENTO')).format('DD/MM/YYYY');
            const valor = Ext.util.Format.MoneyMask.setMask('#9.999.990,00').mask(record.get('FINANCEIROS_ABERTO'));

            if (cpfCnpj.length == 11) {
                cpfCnpj = Ext.util.Format.TextMask.setMask('999.999.999-99', false).mask(cpfCnpj);                                            
            } else if (cpfCnpj.length == 14) {
                cpfCnpj = Ext.util.Format.TextMask.setMask('99.999.999/9999-99', false).mask(cpfCnpj);
            }

            const corpo = `<table style="width:70%">
                <tr>
                    <td>
                    <font size="4" color="black"><p>Segue em anexo o PDF de seus boletos</p></font>
                    <table border="1" style="width:100%;background-color: #c1ddf1;">
                        <tr>
                            <td class="tabcenter" width=10%><b>Documento </b></td>
                            <td class="tabcenter" width=5%> <b>Parcela    </b></td>
                            <td class="tabcenter" width=15%><b>Vencimento</b></td>
                            <td class="tabcenter" width=15%><b>Valor     </b></td>
                            <td class="tabcenter" width=15%><b>CPF/CNPJ  </b></td>
                            <td class="tabcenter" width=40%><b>Nome      </b></td>
                        </tr>
                        <tr>
                            <td class="tabcenter" width=10%><b>${record.get('FINANCEIROS_NUMERO')} </b></td>
                            <td class="tabcenter" width=5%> <b>${record.get('FINANCEIROS_PARCELA')}</b></td>
                            <td class="tabcenter" width=15%><b>${vcto}                             </b></td>
                            <td class="tabcenter" width=15%><b>${valor}                            </b></td>
                            <td class="tabcenter" width=15%><b>${cpfCnpj}                          </b></td>
                            <td class="tabcenter" width=40%><b>${record.get('PESSOAS_NOME')}       </b></td>
                        </tr>
                    </table>
                    </td>
                </tr>
                </table>`;
                    
            await SamosUtils.Email.enviar({
                emails:    emails,
                assunto:   configs.getEmpresa().nome + ' - Anexo boletos emitido para seu CPF/CNPJ',
                template:  'resources/email.html',
                cabecalho: cabecalho,
                corpo:     corpo,
                anexos:    [pdfAnexo]
            });

            SamosUtils.Msg.alert('Sucesso', 'Email enviado com sucesso', 2000);

            if(configs.getClientName() == 'automacao') {  // Na automação            
                Ext.asap(() => { //atualiza silenciosamente o FINANCEIROS_EXPORTADO para E (Emitido)
                    SamosUtils.Request.nodeApi({
                        url: `/processos/financeiros/atualizarstatus`,
                        method: 'POST',
                        data: titulos.map(titulo => {
                            return {
                                'FINANCEIROS_ID'       : titulo.get('FINANCEIROS_ID'),
                                'FINANCEIROS_EXPORTADO': 'E',//Emitido
                            }
                        })
                    });
                });
            }            
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao enviar email');
        }

        view.stopGauge();
    },

    onLinhaDigitavelClick: async function() {
        const record = this.getViewModel().get('model');

        if(!record.get('FINANCEIROS_NOSSONUMERO')) {
            return SamosUtils.Msg.alert('Atenção', 'Boleto sem nosso número');
        }

        if(!(record.get('FINANCEIROS_EXPORTADO') || '').match(/T|E/ig)) {
            return SamosUtils.Msg.alert('Atenção', 'Boleto não enviado para o banco');
        }

        if(!(record.get('FINANCEIROS_STATUS') || '').match(/A/ig)) {
            return SamosUtils.Msg.alert('Atenção', 'Boleto pago');
        }

        const codigoBarras = (record.get('FINANCEIROS_BOLETO') || '').split('|')[0];

        SamosUtils.String.copyTextToClipboard('Sucesso', codigoBarras);
        SamosUtils.Msg.alert('Sucesso', 'Código de barras copiado para a Área de Transferencia');
    }
});
