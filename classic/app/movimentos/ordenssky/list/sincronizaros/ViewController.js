Ext.define('SamosAdmin.movimentos.ordenssky.list.sincronizaros.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.ordensskylistsincronizaros',

    onKeyUpNumeros: async function(txt) {
        await SamosUtils.Utils.sleep(100);

        const value = txt.getValue();
        const numeros = value.replace(/,/ig, ' ').replace(/\s+/ig, ',').split(',');

        if(numeros.length > 10) {
            Ext.Note('warning', 'Limite permitido: 10 OS');
            txt.setValue(numeros.slice(0, 10).join('\n'));
        }
    },

    onSincronizarClick: async function () {
        const view = this.getView();

        try {
            const numeros = this.lookup('numeros').getValue().trim().replace(/,/ig, ' ').replace(/\s+/ig, ',');
    
            if(!numeros) {
                Ext.asap(() => this.lookup('numeros').focus(true));
                throw 'Preencha o(s) número(s) da(s) OS(s)';
            }
    
            view.initGauge('Sincronizando OS (O processo pode demorar)...');
    
            const querySincronizacao = await SamosUtils.Request.delphi('GET', {
                type   : 'processos',
                method : 'buscaordens',
                numeros: numeros
            });

            const result      = querySincronizacao[0].get('resultado') || '';
            const listNumeros = result.split(',');
            const mainView    = view.up('ordenssky');

            const naoEncontradas = listNumeros.filter(numero => !!numero.match(/\*/)).join(', ').replace(/\*/ig, '');
            const encontradas    = listNumeros.filter(numero =>  !numero.match(/\*/)).join(',');

            if(encontradas.length > 0) {
                mainView.getViewModel().set('valueNumero', encontradas);

                await SamosUtils.Utils.sleep(300);
                await mainView.getController().onBuscarClick();

                mainView.getViewModel().set('valueNumero', '');
                view.destroy();

                if(naoEncontradas) {
                    throw `OS(s) ${naoEncontradas} não encontrada(s)`;
                }

            } else if(naoEncontradas) {
                mainView.getViewModel().getStore('main').removeAll();
                view.destroy();
                throw `OS(s) ${naoEncontradas} não encontrada(s)`;
            }
                    
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha na sincronização');
        }

        if(view) { view.stopGauge(); }
    }
});
