Ext.define('SamosAdmin.movimentos.coletas.form.fotos.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.formcoletasfotos',

    onItemDblClick: function(grid, record) {

        const caminho = record.get('COLETASFOTOS_CAMINHO');
           
        const url = `${configs.getApiNode()}/streaming?caminho=${encodeURIComponent(caminho)}&contentType=image/*`;

        const img = this.lookupReference('previewImage');

        if (img) {
            img.setSrc(url);
        }
    },

    onItemClick: function(grid, record) {

        const caminho = record.get('COLETASFOTOS_CAMINHO');
           
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
        const caminho = record.get('COLETASFOTOS_CAMINHO');

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
                const caminho = records[i].get('COLETASFOTOS_CAMINHO');
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
                console.log('downloading: ', records[i].get('COLETASFOTOS_CAMINHO'));
                this.download(records[i].get('COLETASFOTOS_CAMINHO'));
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
                    url: '/coletasfotos',
                    method: 'POST',
                    file: files[i],
                    data: {
                        COLETASFOTOS_ID_COLETAS: vm.get('idColeta')
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
    
            const ids = records.map(record => record.get('COLETASFOTOS_ID'))
    
            if(await SamosUtils.Msg.confirm(msgCmp)) {
                view.initGauge('Excluindo...');

                model.getProxy().setExtraParams({
                    ids: ids.join(','),
                    idColeta: vm.get('idColeta')
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


    onSairClick: function() {
        this.getView().destroy();
    }
});