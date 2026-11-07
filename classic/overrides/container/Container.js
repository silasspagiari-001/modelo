Ext.define('Overrides.container.Container', {
    override: 'Ext.container.Container',

    requires: [
        'Ext.LoadMask'
    ],

    initGauge: function(msg, opacity) {
        if (!this.loading || !this.loading.isVisible(true)) {
            this.loading = Ext.create({
                xtype  : 'loadmask',
                msg    : msg || 'Aguarde...',
                target : this
            });

            this.loading.show();
            this.loading.getEl().dom.style.backgroundColor = `rgba(208,208,208,${opacity || '0.3'})`
        }
    },

    updateGauge: function(msg) {
        if(this.loading && this.loading.isVisible(true)){
            try{
                this.loading.msgTextEl.dom.innerText = msg;
            } catch(e){}
        } else {
            this.initGauge(msg);
        }
    },

    stopGauge: function (naoFocarAposPesquisar) {
        setTimeout(() => {
            if (this) {
                try {
                    if(this.loading){
                        this.loading.destroy();
                    }
                    Ext.$('loadmask').map(mask => mask.hide());
                } catch(e){}
                
                delete this.loading;

                if (naoFocarAposPesquisar !== true) {
                    this.focus();
                }
            }
        }, 200);
    }
});