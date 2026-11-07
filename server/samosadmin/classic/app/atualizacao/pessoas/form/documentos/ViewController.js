Ext.define('SamosAdmin.atualizacao.pessoas.form.documentos.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.formpessoasdocumentos',

    onItemDblClick: function(grid, record) {
        this.onVisualizarClick();
    },

    onVisualizarClick: function (btn, e) {
        const records = this.getView().down('grid').getSelectionModel().getSelection();

        if (records.length > 0) {
            for (let i in records) {
                const caminho = records[i].get('PESSOASDOCUMENTOS_CAMINHO');
                const url = `${configs.getApiNode()}/streaming?caminho=${caminho}&contentType=*/*`;

                window.open(url, '_blank');
            }
        } else {
            Ext.Note('warning', 'Selecione pelo menos um arquivo');
        }
    },

    onBaixarClick: function (btn, e) {
        const records = this.getView().down('grid').getSelectionModel().getSelection();

        if (records.length > 0) {
            for (let i in records) {
                this.download(records[i].get('PESSOASDOCUMENTOS_CAMINHO'));
            }
        } else {
            Ext.Note('warning', 'Selecione pelo menos um arquivo');
        }
    },

    download: function(caminho) {
        const url = `${configs.getApiNode()}/streaming?caminho=${caminho}&contentType=application/*`;
        const fileName = caminho.split('/').pop();

        this.saveToDisk(url, fileName);
    },

    saveToDisk: function (fileURL, fileName) {  
        try {
            var save = document.createElement('a');
            save.href = fileURL;
            save.target = '_blank';
            save.download = fileName || 'unknown';
            save.click()

        } catch(e)  {
            var _window = window.open(fileURL, '_blank');
            _window.document.close();
            _window.document.execCommand('SaveAs', true, fileName || fileURL)
            _window.close();
        }
    },

    onCarregarClick: function() {
        const fileField = this.lookup('carregararquivo').getEl().query('input[type="file"]')[0];

        fileField.value = '';
        fileField.click();    
    },

    onCarregarArquivoChange: async function (filefield) {
        const vm       = this.getViewModel();
        const files    = filefield.getEl().query('input[type="file"]')[0].files;
        const blobFile = new Blob(files, {type: 'application/*'});
        const fileName = filefield.value.split('\\')[filefield.value.split('\\').length - 1];

        if(!filefield.value) { return; }

        const win = Ext.create({
            xtype: 'window',
            title: 'Validade do Arquivo',
            autoShow: true,
            width: 400,
            heigth: 300,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            bodyPadding: 10,
            items: [
                {
                    xtype: 'container',
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'container',
                            flex: 1
                        },
                        {
                            xtype: 'button',
                            text: 'Gravar',
                            margin: '10 7 7 7',
                            ui: `primary-${configs.getTema()}`,
                            handler: gravar
                        },
                        {
                            xtype: 'button',
                            text: 'Cancelar',
                            margin: '10 7 7 0',
                            ui: `tertiary-${configs.getTema()}`,
                            handler: function() {
                                win.destroy();
                            }
                        }
                    ]
                },
                {
                    xtype: 'container',
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'textfield',
                            fieldLabel: 'Documento',
                            flex: 1,
                            value: ''
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: 'Número',
                            flex: 1,
                            value: ''
                        }                        
                    ]
                },
                {
                    xtype: 'datefield',
                    fieldLabel: 'Validade',
                    value: momentServer().format('YYYY-MM-DD')
                }
            ]
        });

        async function gravar() {
            try {
                win.initGauge();

                const validade = moment(win.down('datefield').getValue()).format('YYYY-MM-DD');
                const numero = win.down('textfield[fieldLabel="Número"]').getValue() || new Date().getTime().toString().slice(5,10);
                const documento = win.down('textfield[fieldLabel="Documento"]').getValue() || 'Doc' + new Date().getTime().toString().slice(5,10);

                await SamosUtils.Request.nodeApi({
                    url   : `/pessoasdocumentos`,
                    method: 'POST',
                    file  : blobFile,
                    data  : {
                        'PESSOASDOCUMENTOS_ID_PESSOAS': vm.get('idPessoa'),
                        'PESSOASDOCUMENTOS_NUMERO'    : (numero    || '').replace(/[^a-zA-Z0-9-]/g, '-'),
                        'PESSOASDOCUMENTOS_DOCUMENTO' : (documento || '').replace(/[^a-zA-Z0-9-]/g, '-'),
                        'PESSOASDOCUMENTOS_VALIDADE'  : validade,
                        'PESSOASDOCUMENTOS_EXTENSAO'  : fileName.split('.')[fileName.split('.').length - 1]
                    }
                });
    
                Ext.Note('success', 'Upload concluído');
                vm.get('main').load();
            } catch(error){
                Ext.MessageBox.hide();
                console.error(error);
                Ext.Note('error', 'Erro ao fazer upload');
                if(error && error.responseText){
                    console.error(error.responseText)
                }
            }

            win.destroy();
            filefield.value = '';
        }
    },

    onExcluirClick: async function (btn, e) {
        const view = this.getView();

        try {
            const vm      = this.getViewModel();
            const records = view.down('grid').getSelectionModel().getSelection();
    
            if (!records.length) {
                throw 'Selecione pelo menos um arquivo';
            }
    
            const model = records[0];
    
            const msgCmp = Ext.create({
                xtype: 'component',
                style: 'margin:15px 0px;font-weight:bold;font-size:16px;color:red',
                html:  'Deseja realmente excluir?'
            });
    
            const ids = records.map(record => record.get('PESSOASDOCUMENTOS_ID'))
    
            if(await SamosUtils.Msg.confirm(msgCmp)) {
                view.initGauge('Excluindo...');

                model.getProxy().setExtraParams({
                    ids: ids.join(','),
                    idPessoa: vm.get('idPessoa')
                });

                await model.erase();
                Ext.Note('success', 'Registro excluído');
                await SamosUtils.Utils.sleep(500);
                vm.get('main').load();
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao excluir documento(s)');
        }

        view.stopGauge();
    },

    onSairClick: function() {
        this.getView().destroy();
    }
});