// what keywords to use
var exportData = {};
// default keywords list (in case no results in the DB)
exportData.keywords = [
   'web developer',
   'front end',
   'front end developer',
   'css',
   'css3',
   'html',
   'html5',
   'bootstrap',
   'jquery',
   'javascript',
   'js',
   'software developer',
   'javascript developer',
   'developer',
   'programmer',
   'programator',
   'it'
];
// Defualt cities list
exportData.cities = [
   'brasov',
   'cluj-napoca'
];

// The sites to search in
exportData.sites = [
   'ejobs',
   'bestjobs'
];

// in what category types the results can be put in
exportData.types = [
   'saved',
   'default',
   'deleted'
];



exportData.getData = function(argObj) {
   // argObj
   var resData = {
      keywords: argObj.keywords,
      cities: argObj.cities
   };
   argObj.models.searchData.find({}, function(err, dbResults) {
      
      if(!err && dbResults) {
         for(let i = 0; i < dbResults.length; i++) {
            resData[dbResults[i].type] = dbResults[i].list;
         }
         exportData.keywords = resData.keywords;
         exportData.cities = resData.cities;
         argObj.callback(exportData);
        
         if(!dbResults.length) {
            
            Object.keys(resData).forEach(function(resDataKey) {
               models.searchData.create({
                  list: exportData[resDataKey],
                  type: resDataKey
               });
            });
         }
      }
      else {
         exportData.keywords = resData.keywords;
         exportData.cities = resData.cities;
         argObj.callback(exportData);
      }
   });
};




exportData.run = {
   continue: true,
   runTimeout: [],
   cancel:  function(push) {
      this.continue = false;
      if(this.runTimeout.length) {
         this.runTimeout.forEach(function(crTimeout) {
            clearTimeout(crTimeout);
         });
      }
      this.runTimeout = [];
      if(push) {
         push('stoppedStatus', 'true');
      }
   },
   start: function(argsObj) {
      // runner, args
      if(!this.isRunning) {
         this.continue = true;
         argsObj.runner(argsObj.args);
         if (argsObj.hasOwnProperty('push')) {
            argsObj.push('stoppedStatus', 'false');
         }
      } else {
         console.log('The search is already running');
      }
   },
   get isRunning() {
      return !!(this.continue && this.runTimeout);
   }
};

exportData.updateValues = function (argObj) {
   let valueObj = argObj.valueObj;
   // obj, models, add, run
   if(!argObj.run.isRunning) { // only modify when the app isn't running
      Object.keys(valueObj).forEach(function(type) { // loop trough the data sent in the POST request
         if ((type === 'keywords' || type === 'cities') && Array.isArray(valueObj[type])) { // only take into consideration the two types
            valueObj[type] = valueObj[type].filter(function(currentItem) { // data sanitizer
               return typeof currentItem === 'string' && currentItem.length <= 60 && currentItem; 
            });
            valueObj[type] = valueObj[type].map(function(item) { // string lowercaser (after only strings were kept)
               return item.toLowerCase();
            });
            
            argObj.models.searchData.findOne({type: type}, function(err, dbRes) { // access the DB data
               if (!err && dbRes) { // check for errors
                  valueObj[type].forEach(function (item) { // loop through the items in the POST request
                     if(argObj.add) { // add functionality
                        if(dbRes.list.indexOf(item) === -1) { // check for duplicates
                           dbRes.list.push(item.toLowerCase());
                        }                        
                     } else { // remove functionality
                        var index = dbRes.list.indexOf(item); // find the index of the item to be removed
                        if(index !== -1) { // if index === -1, then the item doesn't exist
                           dbRes.list.splice(index, 1);
                        }  
                     }

                  });
                  exportData[type] = dbRes.list; // synchronizes the values in the memory and the DB
                  dbRes.save(); // saves the DB entry
               }
            });
      
         }
      });
   }
};



module.exports = exportData;