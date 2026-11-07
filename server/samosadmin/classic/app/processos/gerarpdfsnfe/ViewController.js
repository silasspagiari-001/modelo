Ext.define('SamosAdmin.processos.gerarpdfsnfe.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.processosgerarpdfsnfe',

    getServerUrl: function() {
        return 'server/movimentos';
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();

        return {
            numero        : vm.get('valueNumero'),
            empresa       : configs.getMultiEmpresa() ? '' : configs.getEmpresa().id,
            pessoa        : vm.get('valueIdPessoa'),
            documento     : '',
            nomedocumento : vm.get('valueDocumento'),
            operacao      : vm.get('valueDocumento') == 'Orçamentos'  ? '400000' :
                            vm.get('valueDocumento') == 'Pedidos'     ? '500000' :
                            vm.get('valueDocumento') == 'Requisições' ? '600000' : '',
            filtravendedor: (configs.getMovimentos().filtraVendedor && configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor) ? 'true' : 'false',
            movimentosnome: vm.get('valuePessoa'),
            inicio        : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final         : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            tipo          : 0,            
            ordem         : 0//Emissão
            //status        : 1 //Não Faturada
        };
    },

    afterLoadMainStore: function(store, records, success, operation) {
        const valorTotal = records.reduce((total, movimento) => total += cents(movimento.get('MOVIMENTOS_TOTAL')), 0);
        let maskTotal = '';

        if(parseFloat(valorTotal) > 0) {
            maskTotal = Ext.util.Format.MoneyMask.setMask('Total: R$ #9.999.990,00').mask(valorTotal / 100)
        }

        this.getViewModel().set('totalGeral', maskTotal);
    },

    onSelectionChange: function (selModel, records) {
        const valorTotal = records.reduce((total, movimento) => total += cents(movimento.get('MOVIMENTOS_TOTAL')), 0);
        let maskTotal = '';

        if(parseFloat(valorTotal) > 0) {
            maskTotal = Ext.util.Format.MoneyMask.setMask('Selecionado: R$ #9.999.990,00').mask(valorTotal / 100)
        }

        this.getViewModel().set('totalSelecionado', maskTotal);
    },

    onEfetivarClick: async function() {
        const view = this.getView();
        
        try {
            const documentos = view.down('grid').getSelectionModel().getSelection();
            const novaEmissao = momentTz(this.lookup('novaemissao').getValue()).format('YYYY-MM-DD')

            if(!novaEmissao){
                throw 'Selecione a nova emissão';
            }

            if(
                moment(novaEmissao, 'YYYY-MM-DD').isAfter(moment().endOf('month')) ||
                moment(novaEmissao, 'YYYY-MM-DD').isBefore(moment().startOf('month'))
            ) {
                throw 'A nova emissão precisa estar dentro do mês atual';
            }
            
            if(documentos.length == 0){
                throw 'Selecione as requisições';
            }

            if(await SamosUtils.Msg.confirm('Deseja realmente efetivar?')){
                view.initGauge('Efetivando...'); 

                await SamosUtils.Request.nodeApi({
                    url   : `/processos/movimentos/gerarpdfsnfe`,
                    method: 'POST',
                    data  : {
                        ids: documentos.map(r => r.get('MOVIMENTOS_ID')),
                        novaemissao: novaEmissao
                    }
                });

                Ext.Note('success', 'Requisições alteradas com sucesso');
                this.onBuscarClick();
            }       
        } catch(error) {
            console.log(error)
            SamosUtils.Msg.error(error, 'Falha ao alterar requisições');
        }

        view.stopGauge(); 
    },

    /*
    onDownloadClick: async function() {
        const view = this.getView();
        const vm = this.getViewModel();

        try {
            const documentos = view.down('grid').getSelectionModel().getSelection();
    
            if(!documentos[0]){
                throw 'Selecione o(s) documento(s)';
            }          
            
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const parametros = {};
                //Aplica os parametros de geração do PDF
                Ext.apply(parametros, await this.getBuscarParams());
                Ext.apply(parametros, {
                    ids: documentos.map(r => r.get('MOVIMENTOS_ID')),
                    nomedocumento: vm.get('valueDocumento'),
                    produtos: vm.get('valueProdutos'),
                    clientNameConfig    : configs.getClientName(),
                    convenioLocalConfig : configs.getProdutos().conveniolocal
                });

                const queryGerarPDFs = await SamosUtils.Request.nodeApi({
                    url: `/processos/gerarpdfdanfes`,
                    method: 'GET',
                    query: parametros
                });

                await SamosUtils.Utils.sleep(500);

                Ext.Note('success', 'Iniciando download');

                setTimeout( async()=>{

                    function downloadURI(uri, name) {
                        let zip_file_path = uri;
                        let zip_file_name = name;
                        let a = document.createElement("a");
                        document.body.appendChild(a);
                        a.style = "display: none";
                        a.href = zip_file_path;
                        a.download = zip_file_name;
                        a.click();
                        document.body.removeChild(a);
                    }

                    setTimeout( ()=>{
                        downloadURI( configs.getApiNode() + ':/' + queryGerarPDFs.zipped, queryGerarPDFs.zippedName );
                    }, 100 );
                    
                }, 150 );
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir relação de documentos');
        }

        view.stopGauge();
    },*/

    onEnviarEmailClick: async function() {
        const view = this.getView();
        const vm = this.getViewModel();

        try {
            const documentos = view.down('grid').getSelectionModel().getSelection();

            const emailEnviar = await SamosUtils.Msg.prompt('Enviar por Email', 'Preencha o Email abaixo:');
                
            if(!emailEnviar || (emailEnviar && !SamosUtils.String.isEmail(emailEnviar))){
                Ext.Note('warning', 'Digite um email válido');
                return;
            }

            if(!documentos[0]){
                throw 'Selecione o(s) documento(s)';
            }          
            
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando arquivo...');

                const parametros = {};
                //Aplica os parametros de geração do PDF
                Ext.apply(parametros, await this.getBuscarParams());
                Ext.apply(parametros, {
                    ids: documentos.map(r => r.get('MOVIMENTOS_ID')),
                    nomedocumento: vm.get('valueDocumento'),
                    produtos: vm.get('valueProdutos'),
                    clientNameConfig    : configs.getClientName(),
                    convenioLocalConfig : configs.getProdutos().conveniolocal
                });

                const queryGerarPDFs = await SamosUtils.Request.nodeApi({
                    url: `/processos/gerarpdfdanfes`,
                    method: 'GET',
                    query: parametros
                });

                await SamosUtils.Utils.sleep(500);

                //Envia o email
                const cnpjEmpresa = Ext.util.Format.TextMask.setMask('99.999.999/9999-99').mask( configs.getEmpresa().cnpj );
                const nomeEmpresa = configs.getEmpresa().nome;
                const fileName    = queryGerarPDFs.zippedName;
                const mes         = moment().format('MM');
                const ano         = moment().format('YYYY');

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
                        <font size="4" color="red"><p>Segue em anexo o arquivo ZIP com as notas eletrõnicas do CPF/CNPJ ${cnpjEmpresa}</p></font>
                        <table border="1" style="width:100%;background-color: #c1ddf1;">
                            <tr>
                                <td class="tabcenter" width=45%><b>Arquivo</b></td>
                                <td class="tabcenter" width=23%><b>CNPJ</b></td>
                            </tr>
                            <tr>
                                <td class="tabcenter" width=45%><b>${fileName}</b></td>
                                <td class="tabcenter" width=23%><b>${cnpjEmpresa}</b></td>
                            </tr>
                        </table>
                        </td>
                    </tr>
                </table>`;
            
                await SamosUtils.Email.enviar({
                    emails:    emailEnviar,
                    assunto:   `${nomeEmpresa} - Anexo arquivo ZIP com as notas eletrõnicas do CPF/CNPJ ${cnpjEmpresa}`,
                    template:  'resources/email.html',
                    cabecalho: cabecalho,
                    corpo:     corpo,
                    anexos:    [queryGerarPDFs.zipped]
                });

                Ext.Note('success', 'Email enviado!');
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir relação de documentos');
        }

        view.stopGauge();
    }
});