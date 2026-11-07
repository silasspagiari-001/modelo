
Ext.define('SamosAdminModern.notaeletronica.services.Email', {
    alternateClassName: 'NotaEletronica.services.Email',
    singleton: true,

    enviar: async function(view, movimento) {
        const defaultEmail = movimento.get('MOVIMENTOS_EMAIL');

        const email = await SamosUtils.Msg.prompt({
            title       : 'Email', 
            mensagem    : 'Confirme ou digite o email:', 
            initialValue: defaultEmail,
            field       : { upperCased: false }
        });
        
        if(email === false) { return; }//cancelado pelo usuario

        if(!SamosUtils.String.isEmail(email)) {
            throw 'Email inválido';
        }

        view.initGauge('Enviando email...');

        const pdfAnexo   = await this.imprimir(view, movimento);
        const xmlsAnexos = await this.getLinksXML(movimento);
        
        const emissao = momentTz(movimento.get('MOVIMENTOS_EMISSAO')).format('DD/MM/YYYY');
        const valor = Ext.util.Format.MoneyMask.setMask('#9.999.990,00').mask(movimento.get('MOVIMENTOS_TOTAL'));
        const nomePessoa = movimento.get('MOVIMENTOS_NOME');
        
        let cpfCnpj = SamosUtils.String.onlyNumbers(movimento.get('MOVIMENTOS_CPFCNPJ'));

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
                <font size="4" color="red"><p>Segue em anexo XML e PDF da Nota Eletrônica</p></font>
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

        await SamosUtils.Email.enviar({
            emails:      email,
            assunto:     `${configs.getEmpresa().nome} - Anexo Nota Eletrônica emitida para seu CPF/CNPJ ${cpfCnpj}`,
            template:    'resources/email.html',
            cabecalho:   cabecalho,
            corpo:       corpo,
            anexos:      [pdfAnexo, ...xmlsAnexos]
        });

        SamosUtils.Msg.alert('Sucesso', 'Email enviado com sucesso', 2000);
    },

    imprimir: async function(view, movimento) {
        const queryPDF = await SamosUtils.Request.nodeApi({
            url: `/docsfiscais/${configs.getClientName()}/danfe/${movimento.get('MOVIMENTOS_ID')}`,
            method: 'GET'
        });

        return queryPDF.results[0]['name'];
    },

    getLinksXML: async function(movimento) {
        const id = movimento.get('MOVIMENTOS_ID');

        const queryXML = await SamosUtils.Request.delphi('GET', {
            type  : 'notaeletronica',
            method: 'email',
            id    : id
        })

        if(!queryXML[0].get('retorno')){
            console.log('XML não encontrado');
            return [];
        }

        const queryGravarXMLEnvio = await SamosUtils.Request.nodeApi({
            url: `/processos/gravaarquivo`,
            method: 'POST',
            data: {
                nomeArquivo: queryXML[0].get('caminho'),
                conteudo   : queryXML[0].get('retorno')//xml de envio
            }
        });

        let xmlEnvio = queryGravarXMLEnvio.results;
        let xmlCancelamento = null;

        if(!(queryXML[0].get('status') || '').match(/Enviado com sucesso/) && (queryXML[0].get('status') || '').match(/xml/)){
            const queryGravarXMLCancelamento = await SamosUtils.Request.nodeApi({
                url: `/processos/gravaarquivo`,
                method: 'POST',
                data: {
                    nomeArquivo: queryXML[0].get('caminho').replace('nfe', 'can'),
                    conteudo   : queryXML[0].get('status')//xml de cancalemento
                }
            });

            xmlCancelamento = queryGravarXMLCancelamento.results
        }

        return xmlCancelamento ? [xmlEnvio, xmlCancelamento] : [xmlEnvio];
    }
});
