Ext.define('Overrides.Container', {
    override: 'Ext.Container',

    requires: [
        'Ext.LoadMask'
    ],

    initGauge: function() {
        if (!Ext.loading) {
            Ext.loading      = document.createElement('div');
            var tema          = configs.getTema();
            var loadingGauge  = document.createElement('div');
            var centerColor1  = document.createElement('div');
            var centerColor2  = document.createElement('div');
            var centerColor3  = document.createElement('div');
            var rightBlack    = document.createElement('div');
            var rightColor    = document.createElement('div');
            var leftBlack     = document.createElement('div');
            var leftColor     = document.createElement('div');
            
            Ext.loading.id         = 'loading-center';
            loadingGauge.id         = 'loading-gauge';
            centerColor1.className  = `center-color-${tema}-1`;
            centerColor2.className  = `center-color-${tema}-2`;
            centerColor3.className  = `center-color-${tema}-3`;
            rightBlack.className    = 'right-black animation-settings';
            rightColor.className    = `right-color-${tema} animation-settings`;
            leftBlack.className     = 'left-black animation-settings';
            leftColor.className     = `left-color-${tema} animation-settings`;
        
            document.body.appendChild(Ext.loading);
            Ext.loading.appendChild(loadingGauge);
            loadingGauge.appendChild(centerColor1);
            loadingGauge.appendChild(centerColor2);
            loadingGauge.appendChild(centerColor3);
            loadingGauge.appendChild(rightBlack);
            loadingGauge.appendChild(rightColor);
            loadingGauge.appendChild(leftBlack);
            loadingGauge.appendChild(leftColor);
        }
    },

    stopGauge: function (naoFocarAposPesquisar) {
        setTimeout(() => {
            if (this && Ext.loading) {
                try {
                    document.body.removeChild(Ext.loading);
                } catch(e){}
                
                delete Ext.loading;

                if (naoFocarAposPesquisar !== true) {
                    this.focus();
                }
            }
        }, 500);
    },

    initLoadMask: function(msg, opacity = '0.6', height = 40) {
        if (!this.loading || !this.loading.isVisible(true)) {
            this.loading = Ext.create({
                xtype:   'loadmask',
                message: msg || 'Aguarde...',
                fullscreen: true,
                height: height,
                style: {
                    backgroundColor: `rgba(208, 208, 208, ${opacity})`
                }
            });

            this.loading.show();
        }
    },

    stopLoadMask: function (naoFocarAposPesquisar) {
        setTimeout(() => {
            if (this && this.loading) {
                try {
                    this.loading.destroy();
                } catch(e){}
                
                delete this.loading;

                if (naoFocarAposPesquisar !== true) {
                    this.focus();
                }
            }
        }, 500);
    }
});
