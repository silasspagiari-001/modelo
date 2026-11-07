Ext.define('Ext.data.BaseModel', {
    extend: 'Ext.data.Model',

    requires: [
        'Ext.data.validator.*',
        'Ext.data.proxy.BaseRest'
    ],

    config: {
        editing: null,
        idParent: null,
        api: null        
    },

    /*
     * Override:
     * Forcing defaultValue fields initilize after model creating
     */
    constructor: function () {
        this.callParent(arguments);

        for (let i in this.defaultValues) {
            if (this.get(i)) {
            //if (this.get(i) || this.get(i) === '' || this.get(i) === 0) {
                delete this.defaultValues[i];
            }
        }

        this.set(this.defaultValues);
    },

    /*
     * Added:
     * Check if this model is new or if it came from server
     */
    isNew: function () {
        return !this.store;
    },

    isEditing: function () {
        return !!this.getEditing();
    },

    /*
     * Added:
     * Check if model has an especific field
     */
    hasField: function (fieldName) {
        return !!this.get(fieldName);
    },

    save: function(options) {
        /*
         * Override:
         * Returning a Promise
         */
        return new Ext.Promise((resolve, reject) => {
            options = Ext.apply({}, options);

            var me = this,
                phantom = me.phantom,
                dropped = me.dropped,
                action = dropped ? 'destroy' : (phantom ? 'create' : 'update'),
                //scope  = options.scope || me,
               // callback = options.callback,
                proxy = me.getProxy(),
                operation;

            /*
             * Added:
             * Remove mask from samoswidgets-maskfields before send to server
             */
            this.unmaskFields();

            /*
             * Added:
             * Remove fields with persist= false before send to server
             */
            this.removeLocalFields();

            options.records = [me];
            options.internalCallback = function(operation) {
                var args = [me, operation],
                    success = operation.wasSuccessful(),
                    localFields = me.getLocalFields();

                if (success) {
                    for (var i in localFields) {
                        me.data[localFields[i]] = me.localData[localFields[i]];
                    }

                    resolve(...args);
                    //Ext.callback(options.success, scope, args);
                } else {
                    reject(...args);
                    //Ext.callback(options.failure, scope, args);
                }
                //args.push(success);
                //Ext.callback(callback, scope, args);
            };
            delete options.callback;

            operation = proxy.createOperation(action, options);

            if (dropped && phantom) {
                operation.setResultSet(Ext.data.reader.Reader.prototype.nullResultSet);
                me.setErased();
                operation.setSuccessful(true);

            } else {
                /*
                 * Override:
                 * Handle URL before execute operation
                 */
                this.executeOperation(operation);
            }
        });
    },

    /*
     * Added:
     * Handle URL before execute operation and construct strjson proxy param
     * E.g.: it replace "server" string to "http://meuserver.com.br"
     */
    executeOperation: function (operation) {
        var proxy = this.getProxy(),
            urlArray;

        if (proxy) {
            if(proxy.getUrl){
                urlArray =  proxy.getUrl().split('/');
                urlArray[0] = urlArray[0].match(/http/) ? urlArray[0] : (this.getApi() || configs.getApiNode());
                proxy.setUrl(urlArray.join('/'));
            }

            proxy.setObjParams(
                Ext.Object.merge(
                    proxy.getObjParams(), 
                    {
                        strjson: this.getStrJson()
                    }
                )
            );
        }

        operation.execute();
    },

    /*
     * Added:
     * Remove mask from samoswidgets-maskfields before send to server
     */
    unmaskFields: function () {
        var fields = this.getFields();
        for (var i in fields) {
            if (fields[i].type == 'mask') {
                this.set(
                    fields[i].getName(),
                    SamosUtils.String.onlyNumbers(this.get(fields[i].getName()))
                );
            }
        }
    },

    /*
     * Added:
     * Remove fields with persist= false before send to server
     */
    removeLocalFields: function() {
        var localFields = this.getLocalFields(),
            i;

        this.localData = [];

        for (i in localFields) {
            this.localData[localFields[i]] = this.data[localFields[i]];
            delete this.data[localFields[i]];
        }

        return this;
    },

    getLocalFields: function () {
        var fields = this.getFields(),
            result = [], i;

        for (i in fields) {
            if (fields[i].persist === false) {
                result.push(fields[i].name);
            }
        }

        return result;
    },

    /*
     * Added:
     * Check if model has some field
     */
    getStrJson: function () {
        return SamosUtils.Json.objToJson(this.data) || '{}';
    },

    setParams: function (params) {
        this.getProxy().setObjParams(params);
    },

    privates: {
        statics: {
            /*
             * Override:
             * changind reorder behavior of added models
             */
            topoAdd: function(field) {
                var
                    dep = field.depends,
                    dependsLength = dep ? dep.length : 0,
                    rankedFields = this.rankedFields,
                    i, targetField,
                    topoStack = this.topoStack || (this.topoStack = []);

                topoStack.push(field.name);
                if (field.rank === 0) {
                    // if (adding)
                    Ext.raise(this.$className + " has circular field dependencies: " + topoStack.join(" --> "));
                }
                /*if (topoStack.length && field.evil) {
                    Ext.raise(this.$className + ": Field " + topoStack[topoStack.length - 1] + " cannot depend on depends-less field " + field.name);
                }*/
                field.rank = 0;
                // adding (falsey but we can still detect cycles)
                for (i = 0; i < dependsLength; ++i) {
                    // Get the targetField on which we depend and add this field to the
                    // targetField.dependents[]
                    targetField = this.fieldsMap[dep[i]];
                    if (!targetField) {
                        Ext.raise(this.$className + ": Field " + field.name + " depends on undefined field " + dep[i]);
                    }
                    (targetField.dependents || (targetField.dependents = [])).push(field);
                    if (!targetField.rank) {
                        // if (!added)
                        this.topoAdd(targetField);
                    }
                }
                rankedFields.push(field);
                field.rank = rankedFields.length;
                // 1-based (truthy to track "added" state)
                topoStack.pop();
            }
        }
    }
});
