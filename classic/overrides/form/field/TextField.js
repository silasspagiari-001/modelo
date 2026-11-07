Ext.define('Overrides.form.field.Text', {
    override:'Ext.form.field.Text',

    labelAlign: 'top',
    margin: '0 5 0 0',
    msgTarget: 'under',
    padding: 0,
    enforceMaxLength: true,
    enableKeyEvents: true,
    enableEnterToTab: true,
    selectOnFocus: true,
    naoSairSeVazio: false,
    
    minLengthText : 'O mínimo de caracteres para este campo é {0}',
    maxLengthText : 'O máximo de caracteres para este campo é {0}',
    blankText : 'Campo obrigatório',
    
    config: {
        clicarNoProximoFoco: false,
        searchedId: '',
        proximoFoco: null,
        title: ''
    },

    constructor: function(cfg) {
        this.flex = cfg.width ? 0 : 1,

        this.callParent(arguments);

        if (this.xtype !== 'textarea') {
            setTimeout(() => {
                this.on('specialkey', this.convertEnter);
            }, 500);
        }

        if(this.ui == 'default'){
            this.setUI('textbold-' + configs.getTema());
        }

        if(
            configs.getCase() == 'uppercase' && 
            this.disableCase != true && 
            this.xtype != 'samoswidgets-textlower' && 
            this.xtype != 'samoswidgets-textnone' && 
            this.xtype != 'datefield' &&
            this.xtype != 'combobox'
        ){
            const fieldStyle = 'text-transform:uppercase;';
            if(this.getFieldStyle()){
                this.setFieldStyle(fieldStyle + this.getFieldStyle());
            } else {
                this.setFieldStyle(fieldStyle);
            }
        }
    },

    listeners: {
        change: function (txt, nv) {
            if(
                configs.getCase() == 'uppercase' && 
                this.disableCase != true && 
                this.xtype != 'samoswidgets-textlower' && 
                this.xtype != 'samoswidgets-textnone' && 
                this.xtype != 'datefield' &&                
                this.xtype != 'combobox'
            ){   
                if (nv && nv.toUpperCase) {
                    const el        = txt.inputEl.dom;
                    const selection = el.selectionStart;

                    txt.suspendEvents();
                    txt.setValue(nv.toUpperCase());
                    //para evitar que o cursor va para o final ao alterar uma letra no meio da string
                    el.selectionStart = el.selectionEnd = selection;
                    txt.resumeEvents();
                }
            }
        }
    },

    convertEnter: function (txt, event) {
        if(txt.callbackFn){ return; }
        
        if (SamosUtils.Events.isEnter(event)) {
            if(event.stopEvent) { event.stopEvent(); }
       
            const view = this.getMainView();
            const thisLineId = parseInt(SamosUtils.String.onlyNumbers(txt.reference));
            const nextLineId = thisLineId.toString() == 'NaN' ? -1 : thisLineId + 1;
            let ref;
            
            if(txt.proximoFoco && !!txt.proximoFoco.match('linhadebaixo')){
                ref = txt.proximoFoco.replace('[linhadebaixo]', nextLineId);
            } else if(txt.proximoFoco) {
                ref = txt.proximoFoco + (thisLineId.toString() == 'NaN' ? '' : thisLineId);
            }
    
            const proximoFoco = view && view.getReferences() ? view.getReferences()[ref] : null;
            const value = txt.getValue();
            const naoSair = txt.naoSairSeVazio && (!value || value == 0 || value.toString().replace(/%/g, '') == '' || value.toString().trim() == '');
            
            if (proximoFoco && !naoSair && !txt.readOnly) {
                if(this.clicarNoProximoFoco){
                    proximoFoco.fireEvent('click', proximoFoco);
                } else if(this.enableEnterToTab){
                    if(proximoFoco.getY() + 40 > window.innerHeight){
                        setTimeout(() => {
                            proximoFoco.el.dom.scrollIntoView();
                            Ext.defer(proximoFoco.focus, 150, proximoFoco, [true]);
                        }, 1);
                    } else {
                        Ext.defer(proximoFoco.focus, 150, proximoFoco, [true]);
                    }
                }
            }
        }
    }
});

Ext.form.field.VTypes.emailText = 'Informe um email v&aacutelido';
