import fs from 'fs'
import search from 'recursive-search';
import path from 'path';
import { Meteor } from 'meteor/meteor';


Meteor.methods({
    'getAvailableAPIs': function () {
        //Discover APIs
       console.log('projects discovered: ', APIprojects.length);
       return APIprojects;

    }
})
