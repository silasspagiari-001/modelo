Ext.define('SamosAdmin.processos.xmlcontabilidade.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.xmlcontabilidade',

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
            let queryEnvio = '';

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

                        const guidEnvio = SamosUtils.String.gerarGuid();                    
                        queryEnvio = await SamosUtils.Request.nodeApi({
                            url: `/processos/movimentos/processostxt`,
                            method: 'POST',
                            data: {
                                type   : 'processos',
                                method : 'enviarxml',
                                cnpj   : empresa.get('EMPRESAS_CPFCNPJ'),
                                mes    : mes,
                                ano    : ano,
                                guid  : guidEnvio
                            }
                        });        

                        let fileName = '';
                        let fileNameA = '';
                        let fileNameB = '';
                        let fileNameC = '';
                        
                        const listaArquivos = queryEnvio[0].data['arquivo'].split('|');

                        if(listaArquivos[0] && listaArquivos[0] != '') { fileName = listaArquivos[0]; }
                        if(listaArquivos[1] && listaArquivos[1] != '') { fileNameA = listaArquivos[1];}
                        if(listaArquivos[2] && listaArquivos[2] != '') { fileNameB = listaArquivos[2];}
                        if(listaArquivos[3] && listaArquivos[3] != '') { fileNameC = listaArquivos[3];}

                        await SamosUtils.Utils.sleep(2000);

                        let arrayAnexos = [];

                        if(fileName)  { arrayAnexos.push(`public/zip/${fileName}`); }
                        if(fileNameA) { arrayAnexos.push(`public/zip/${fileNameA}`); }
                        if(fileNameB) { arrayAnexos.push(`public/zip/${fileNameB}`); }
                        if(fileNameC) { arrayAnexos.push(`public/zip/${fileNameC}`); }

                        // ZIP separado com os XMLs de entrada recebidos dos fornecedores.
                        // O backend só retorna arquivoEntrada quando a pasta do CNPJ/ano/mês
                        // existe e contém pelo menos um arquivo .xml.
                        const fileNameEntrada = queryEnvio[0].data['arquivoEntrada'] || '';
                        if(fileNameEntrada) { arrayAnexos.push(`public/zip/${fileNameEntrada}`); }
        
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
                                <font size="4" color="red"><p>Segue em anexo arquivos XML do CPF/CNPJ ${cnpjEmpresa}</p></font>
                                <table border="1" style="width:100%;background-color: #c1ddf1;">
                                    <tr>
                                        <td class="tabcenter" width=45%><b>Arquivo</b></td>
                                        <td class="tabcenter" width=23%><b>CNPJ</b></td>
                                        <td class="tabcenter" width=15%><b>Mês</b></td>
                                        <td class="tabcenter" width=12%><b>Ano</b></td>
                                    </tr>
                                    <tr>
                                        <td class="tabcenter" width=45%><b>${fileName ? fileName : ''} ${fileNameA ? fileNameA : ''} ${fileNameB ? fileNameB : ''} ${fileNameC ? fileNameC : ''} ${fileNameEntrada ? fileNameEntrada : ''}</b></td>
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
                            assunto:   `${nomeEmpresa} - Anexo arquivos XML do CPF/CNPJ ${cnpjEmpresa}`,
                            template:  'resources/email.html',
                            cabecalho: cabecalho,
                            corpo:     corpo,
                            anexos:    arrayAnexos
                        });
    
                        results.enviados.push(nomeEmpresa);
    
                    } catch(error) {
                        console.error(error);
                        results.naoEnviados.push(nomeEmpresa);
                    }
                }

                if(results.naoEnviados == 0) {
                    Ext.Note('success', 'Email enviado com sucesso');
                } else {
                    Ext.Msg.alert('Atenção', `Enviados: ${results.enviados.length}<br><br>Não Enviados: <br>${results.naoEnviados.join('<br>')}`);
                }
            }       
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao enviar XMLs por email');
        }

        view.stopGauge(); 
    }
});