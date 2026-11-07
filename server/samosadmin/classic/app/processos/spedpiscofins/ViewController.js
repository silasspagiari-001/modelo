Ext.define('SamosAdmin.processos.spedpiscofins.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.spedpiscofins',

    getServerUrl: function() {
        return 'server/consultas/empresasspedcofins';
    },

    getBuscarParams: function () {
        const vm = this.getViewModel();

        return {
            conteudo: vm.get('valueConteudo'),
            ordem   : vm.get('valueOrdem'),
            simples : configs.getClientName().match(/lislais|herbiquimica/) ? '' : 'F'
        };
    },
    
    onGerarClick: async function() {
        const view = this.getView();

        try {
            const vm       = this.getViewModel();
            const empresas = view.down('grid').getSelectionModel().getSelection();
            const tipo     = vm.get('valueTipo');
            const email    = vm.get('valueEmail');
            const mes      = vm.get('valueMes');
            const ano      = vm.get('valueAno');
            const preco    = vm.get('valuePreco');
        
            if(!mes || !ano){
                throw 'Selecione o mês e ano';
            }

            if(!preco){
                throw 'Selecione o preço do inventário';
            }            

            if(empresas.length == 0){
                throw 'Selecione a(s) empresa(s)';
            }
            
            if(!email || (email && !SamosUtils.String.isEmail(email))){
                Ext.asap(() => this.lookup('email').focus());
                throw 'Digite um email válido';
            }

            if(await SamosUtils.Msg.confirm('Deseja realmente gerar?')){
                Ext.MessageBox.show({
                    title: 'Aguarde',
                    msg: 'Calculando...',
                    progressText: 'Iniciando...',
                    width: 300,
                    progress: true,
                    closable: false
                });

                const TEMPO_POR_DOCUMENTO = 670;//ms
                const mesCompleto = SamosUtils.String.completeChars(mes, 2);
                const idsEmpresas = empresas.map(empresa => empresa.get('EMPRESAS_ID')).join(',');

                const totalDocumentos = await SamosUtils.Request.nodeApi({
                    url: `/consultas/totalsped`,
                    method: 'GET',
                    query: {
                        mes: mesCompleto,
                        ano: ano,
                        empresas: idsEmpresas
                    }
                });

                const updateProgress = async counter => {
                    try {
                        counter = counter || 0;
                        const progress = (counter / totalDocumentos) * 100;

                        Ext.MessageBox.updateProgress(progress / 100, Math.round(progress) + '%');
            
                        if(progress >= 99) {
                            Ext.MessageBox.updateText('Finalizando. Aguarde...');
                        } else if(progress > 0) {
                            Ext.MessageBox.updateText('Processando...');
                        }

                        if(progress < 100 && Ext.MessageBox.isVisible(true)) { 
                            await SamosUtils.Utils.sleep(TEMPO_POR_DOCUMENTO);
                            updateProgress(++counter);
                        }
                    } catch(error) {
                        console.error(error);
                    }
                };

                updateProgress();
                
                const guidSped = SamosUtils.String.gerarGuid();                    
                let result = await SamosUtils.Request.nodeApi({
                    url: `/processos/movimentos/processostxt`,
                    method: 'POST',
                    data: {
                        type  : 'processos',
                        method: tipo,
                        ids    : idsEmpresas,
                        mes    : mesCompleto,
                        ano    : ano,
                        preco  : preco,
                        guid  : guidSped
                    }
                });

                Ext.MessageBox.hide();

                let fileName = result[0].data['arquivo'];

                const spedAnexo  = `public/zip/${fileName}`;

                const cabecalho = `<table style="width:70%">
                    <tr>
                        <td width=20%></td>
                    </tr>
                </table>
                <br>`;

                const corpo = `<table style="width:70%">
                    <tr>
                        <td>
                        <font size="4" color="red"><p>Segue em anexo o arquivo SPED</p></font>
                        <table border="1" style="width:100%;background-color: #c1ddf1;">
                            <tr>
                                <td class="tabcenter" width=68%><b>Arquivo</b></td>
                                <td class="tabcenter" width=15%><b>Mês</b></td>
                                <td class="tabcenter" width=12%><b>Ano</b></td>
                            </tr>
                            <tr>
                                <td class="tabcenter" width=68%><b>${fileName}</b></td>
                                <td class="tabcenter" width=15%><b>${mes}</b></td>
                                <td class="tabcenter" width=12%><b>${ano}</b></td>
                            </tr>
                        </table>
                        </td>
                    </tr>
                </table>`;
            
                await SamosUtils.Email.enviar({
                    emails:    email,
                    assunto:   `Anexo arquivo SPED`,
                    template:  'resources/email.html',
                    cabecalho: cabecalho,
                    corpo:     corpo,
                    anexos:    [spedAnexo]
                });

                Ext.Note('success', 'Email enviado com sucesso');
            }
        } catch(error) {
            Ext.MessageBox.hide();
            SamosUtils.Msg.error(error, 'Erro ao gerar o arquivo');
        }

        view.stopGauge();
    }
});