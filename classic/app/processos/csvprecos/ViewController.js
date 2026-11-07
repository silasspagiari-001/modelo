Ext.define('SamosAdmin.processos.csvprecos.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.csvprecos',

    getServerUrl: function() {
        return 'server/consultas/empresasspedcofins';
    },

    getBuscarParams: function () {
        return {
            conteudo: '',
            ordem   : 0,
            simples : ''
        };
    },
    
    onEnviarClick: async function() {
        const view = this.getView();
        
        try {
            const vm       = this.getViewModel();
            const empresas = view.down('grid').getSelectionModel().getSelection();
            const email    = vm.get('valueEmail');
            const mes      = vm.get('valueMes');
            const ano      = vm.get('valueAno');

            if(!mes || !ano){
                throw 'Selecione o mês e ano';
            }
            
            if(empresas.length == 0){
                throw 'Selecione a(s) empresa(s)';
            }
            
            if(!email || (email && !SamosUtils.String.isEmail(email))){
                Ext.asap(() => this.lookup('email').focus());
                throw 'Digite um email válido';
            }
            
            if(await SamosUtils.Msg.confirm('Deseja realmente enviar?')){
                view.initGauge('Enviando...'); 

                const results = {
                    enviados   : [],
                    naoEnviados: []
                };

                for (let empresa of empresas) {
                    const nomeEmpresa = empresa.get('EMPRESAS_FANTASIA');

                    view.updateGauge(`Enviando (${nomeEmpresa})...`); 
                    
                    try {
                        const queryPRE = await SamosUtils.Request.nodeApi({  
                            url: `/processos/gerarprecocompra`,
                            method: 'GET',
                            data: {
                                empresa : empresa.get('EMPRESAS_ID'),
                                cnpj    : empresa.get('EMPRESAS_CPFCNPJ'),
                                mes     : mes,
                                ano     : ano
                            }
                        });
            
                        const arqAnexo  = queryPRE;
                        const cnpjEmpresa = Ext.util.Format.TextMask.setMask('99.999.999/9999-99').mask(empresa.get('EMPRESAS_CPFCNPJ'));
        
                        const cabecalho = `<table style="width:70%">
                            <tr>
                                <td width=10%><font size="3" color="back"><p>Emitente:</p></font></td>
                                <td width=70%><font size="3" color="red"><p>${nomeEmpresa} ${cnpjEmpresa}</p></font></td>
                                <td width=20%></td>
                            </tr>
                        </table>
                        <br>`;
        
                        const corpo = `<table style="width:70%">
                            <tr>
                                <td>
                                <font size="4" color="red"><p>Segue em anexo arquivo PRECOS do CPF/CNPJ ${cnpjEmpresa}</p></font>
                                <table border="1" style="width:100%;background-color: #c1ddf1;">
                                    <tr>
                                        <td class="tabcenter" width=23%><b>CNPJ</b></td>
                                        <td class="tabcenter" width=15%><b>Mês</b></td>
                                        <td class="tabcenter" width=12%><b>Ano</b></td>
                                    </tr>
                                    <tr>
                                        <td class="tabcenter" width=23%><b>${cnpjEmpresa}</b></td>
                                        <td class="tabcenter" width=15%><b>${mes}</b></td>
                                        <td class="tabcenter" width=12%><b>${ano}</b></td>
                                    </tr>
                                </table>
                                </td>
                            </tr>
                        </table>`;
                    
                        await SamosUtils.Email.enviar({
                            emails:    email,
                            assunto:   `${nomeEmpresa} - Anexo arquivo TXT COM PREÇOS DE COMPRA DIVERGENTES, do CPF/CNPJ ${cnpjEmpresa}`,
                            template:  'resources/email.html',
                            cabecalho: cabecalho,
                            corpo:     corpo,
                            anexos:    [arqAnexo]
                        });
        
                    } catch(error) {
                        console.error(error);
                    }
                }

                Ext.Note('success', 'Email enviado com sucesso');
            }       
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao enviar TXTs por email');
        }

        view.stopGauge(); 
    }
});