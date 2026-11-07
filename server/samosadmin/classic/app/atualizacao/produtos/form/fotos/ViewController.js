Ext.define('SamosAdmin.atualizacao.produtos.form.fotos.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.formprodutosfotos',

    onItemDblClick: function(grid, record) {

        const caminho = record.get('PRODUTOSFOTOS_CAMINHO');
           
        const url = `${configs.getApiNode()}/streaming?caminho=${encodeURIComponent(caminho)}&contentType=image/*`;

        const img = this.lookupReference('previewImage');

        if (img) {
            img.setSrc(url);
        }
    },

    onItemClick: function(grid, record) {

        const caminho = record.get('PRODUTOSFOTOS_CAMINHO');
           
        const url = `${configs.getApiNode()}/streaming?caminho=${encodeURIComponent(caminho)}&contentType=image/*`;

        const img = this.lookupReference('previewImage');

        if (img) {
            img.setSrc(url);
        }

    },
        
    onSelectionChange: function(selModel, selections) {
        if (selections.length) {
            this.mostrarPreview(selections[0]);
        }
    },

    mostrarPreview: function(record) {
        const caminho = record.get('PRODUTOSFOTOS_CAMINHO');

        const url = `${configs.getApiNode()}/streaming?caminho=${encodeURIComponent(caminho)}&contentType=image/*`;
    
        const img = this.lookupReference('previewImage');
    
        if (img) {
            img.setSrc(url);
        }
    
    },

    onVisualizarClick: function (btn, e) {
        const records = this.getView().down('grid').getSelectionModel().getSelection();

        if (records.length > 0) {
            for (let i in records) {
                const caminho = records[i].get('PRODUTOSFOTOS_CAMINHO');
                console.log('caminho> ', caminho);
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
                console.log('downloading: ', records[i].get('PRODUTOSFOTOS_CAMINHO'));
                this.download(records[i].get('PRODUTOSFOTOS_CAMINHO'));
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

        fileField.setAttribute('multiple', 'multiple');
        fileField.value = '';
        fileField.click();    
    },

    onCarregarArquivoChange: async function(filefield) {
        const vm = this.getViewModel();
    
        const files = filefield.getEl()
            .query('input[type="file"]')[0]
            .files;
    
        if (!files || !files.length) {
            return;
        }
    
        try {
    
            this.getView().initGauge(
                `Enviando ${files.length} arquivo(s)...`
            );
    
            for (let i = 0; i < files.length; i++) {
    
                await SamosUtils.Request.nodeApi({
                    url: '/produtosfotos',
                    method: 'POST',
                    file: files[i],
                    data: {
                        PRODUTOSFOTOS_ID_PRODUTOS: vm.get('idProduto')
                    }
                });
    
            }
    
            Ext.Note(
                'success',
                `${files.length} arquivo(s) enviado(s) com sucesso`
            );
    
            vm.get('main').load();
    
        } catch (error) {
    
            console.error(error);
    
            Ext.Note('error', 'Erro ao fazer upload dos arquivos');
    
        } finally {    
            this.getView().stopGauge();    
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
    
            const ids = records.map(record => record.get('PRODUTOSFOTOS_ID'))
    
            if(await SamosUtils.Msg.confirm(msgCmp)) {
                view.initGauge('Excluindo...');

                model.getProxy().setExtraParams({
                    ids: ids.join(','),
                    idProduto: vm.get('idProduto')
                });

                await model.erase();

                const img = this.lookupReference('previewImage');
    
                if (img) {
                    img.setSrc('');
                }

                Ext.Note('success', 'Registro excluído');                

                await SamosUtils.Utils.sleep(500);
                vm.get('main').load();
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao excluir foto(s)');
        }

        view.stopGauge();
    },

    onDescricaoClick: function(btn, e) {

        const formProduto = Ext.$('formprodutos')[0];
        const produto = formProduto.getViewModel().get('model');

        const win = Ext.create({
            xtype: 'window',
            title: 'Produto',
            autoShow: true,
            width: 700,
            heigth: 300,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            bodyPadding: 10,
            items: [
                {
                    xtype: 'textfield',
                    fieldLabel: 'Descrição',
                    reference: 'descricaofoto',
                    maxLength: 512,
                    value: produto.get('PRODUTOS_DESCRICAO')
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
                }
            ]
        });

        async function gravar() {
            try {
               
                win.initGauge();

                const novaDescricao = win.down('[reference=descricaofoto]').getValue();

                await SamosUtils.Request.nodeApi({
                    url: `/processos/produtos/alterardescricao/${produto.get('PRODUTOS_ID')}`,
                    method: 'PUT',
                    data: {
                        'PRODUTOS_DESCRICAO': novaDescricao
                    }
                });

                Ext.Note('success', 'Gravado com sucesso');

                produto.set('PRODUTOS_DESCRICAO', novaDescricao);

                win.destroy();
            } catch(error) {
                win.stopGauge(true);
                SamosUtils.Msg.error(error, 'Falha ao alterar descrição do produto');
            }
        }
    },

    onSairClick: function() {
        this.getView().destroy();
    }
});