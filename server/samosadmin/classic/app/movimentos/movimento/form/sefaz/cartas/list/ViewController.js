Ext.define('SamosAdmin.movimentos.movimento.form.sefaz.cartas.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.formmovimentossefazcartas',

    onNovoClick: async function(btn, event) {
        const vm = this.getViewModel();
        const movimento = vm.get('movimento');
        const store = vm.get('main');
        const newModel = Ext.create(this.getView().modelName || this.$className.replace(/\.[a-z]*\.ViewController/, '.Model'));

        newModel.set(newModel.getIdProperty(), (store.getCount() + 1) * -1);

        newModel.set({
            'MOVIMENTOSCARTAS_ID_MOVIMENTOS': movimento.get('MOVIMENTOS_ID'),
            'MOVIMENTOS_NFE' : movimento.get('MOVIMENTOS_NFE')            
        });

        for(i in movimento.data){
            if(i.match(/_LOG$/)){
                movimento.set(i, SamosUtils.Info.getLog());
                break;
            }
        }

        SamosUtils.Events.enableWarnReload();
        return await this.createForm(newModel);
    },

    createForm: async function (record, readOnly) {
        const newForm = Ext.create({
            xtype: 'formmovimentossefazformcartas'
        });

        const formCartasController = newForm.getController();
        
        newForm.getViewModel().set({
            'readOnly':      !!readOnly,
            'initialValues': record.isNew() ? {} : record.getData(),
            'previousModel': undefined,
            'editionClosed': true,
            'model':         record
        });

        formCartasController.doDefaultFocus();
        newForm.applyTextSearches();
        
        return newForm;
    },

    loadCartas: function() {
        var loader = setInterval(() => {
            let vm = this.getViewModel(),
                store = vm.getStore('main'),
                data = vm.get('dataCartas'),
                localData = vm.get('localData');

            if(store) {
                clearTimeout(loader);

                if(localData && localData[0]){
                    for (let i in localData[0]) {
                        for (let j in localData[0][i]) {
                            data[i][j] = localData[0][i][j];
                        }
                    }
                }

                store.setData(data);
            }  
        }, 200);
    }
});