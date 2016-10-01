if (Meteor.isServer) {
    import fs from 'fs-extra';
    import search from 'recursive-search';
    import path from 'path';
    import yaml from 'yamljs';
    import { Meteor } from 'meteor/meteor';
    import { mkdirp } from 'mkdirp';
    import { exec } from 'child_process'

    const ip = require('ip');
    const projects_path = '../../../../../../../../';
    const project_root = '../../../../../../../../';
    let root_projects = fs.readdirSync(project_root);
    const my_project_name = root_projects.find(function (proj) { if (proj.includes('swagger-watcher') || proj.includes('swagger-api-watcher')) return true; }) || 'swagger-api-watcher';
    const local_project_root = path.join(projects_path, `/${my_project_name}/swagger-watch/api-watch`);
    const swag_temp_dir = path.join(projects_path, `/${my_project_name}/swagger-watch/api-watch/public`, 'swagger_template');
    const swagger_yaml_file = 'swagger.yaml';
    const swagger_json_file = 'swagger.json';
    const hostOS = process.platform.includes('win') ? 'WINDOWS' : 'LINUX';
    const swagger_gen_dir = hostOS.includes('WINDOWS') ? 'C:/temp/swagger_generated' : '/etc/swagger_generated';

    APIprojects = [];
    meteorHostIP = ip.address();

    console.log('------------------ ENVIRONMENT INFO--------------');
    console.log('Host os: ', hostOS);
    console.log('Root url', Meteor.absoluteUrl());
    console.log('Project name: ', my_project_name);
    console.log('Host IP :', ip.address());
    console.log('-------------------------------------------------');


    function discoverSwagerAPI() {
        return new Promise(function (resolve, reject) {
            fs.readdir(projects_path, function (err, res) {
                //console.log('read those dirs : ', res);
                res.forEach(function (project) {
                    if (!project.includes(my_project_name))
                        search.recursiveSearch(swagger_yaml_file, path.join(projects_path, project), function (err, res) {
                            //We found something
                            if (res) {
                                APIprojects.push({
                                    project_name: project,
                                    yaml_path: res
                                })
                            }
                        },
                            //when search is completed.
                            function (results) {
                                if (results) {
                                    console.log(`[lib] Discovered API projects. ${project} `);
                                    resolve(results);
                                }
                                else {
                                    reject('No projects with API found. Make sure swagger.yaml exists in your projet folders');
                                }
                            }
                        )
                })
            })
        });
    }


    function createSwaggerDirectories() {
        return new Promise(function (resolve, reject) {
            APIprojects.forEach(function (project) {
                try {
                    let project_swag_dir = path.join(swagger_gen_dir, project.project_name);

                    mkdirp.sync(project_swag_dir);
                    //console.log(`will copy from \r\n ${swag_temp_dir}  \r\n to \r\n ${project_swag_dir}`)
                    fs.copy(swag_temp_dir, project_swag_dir, function (err) {
                        if (err) {
                            console.log('error copying template dir ', err);
                            reject(err)
                        }
                        else {
                            project['swagger_dir'] = project_swag_dir;
                            console.log("swag project. willk resolve created at ", project_swag_dir);
                            resolve();
                        }
                    });
                    //resolve('s');
                }
                catch (ex) {
                    console.log('---- rejected :', ex);
                    reject(ex);
                }
            })
        });
    }

    function convertYAMLtoJSON() {
        return new Promise(function (resolve, reject) {
            APIprojects.forEach(function (project) {
                console.log('proj yaml path : ', project.yaml_path);
                fs.readFile(project.yaml_path, 'utf8', function (err, res) {

                    if (err) reject(err);

                    let yamlFileContent = res;
                    let yamlJSON = '';
                    try {
                        //write file in project dir
                        yamlJSON = yaml.parse(yamlFileContent);
                        let swaggerJSONPath = path.join(project.swagger_dir, 'swagger.json');
                        fs.writeFileSync(swaggerJSONPath, JSON.stringify(yamlJSON), 'utf8');
                        project.swagger_json = swaggerJSONPath;
                        console.log('YAML converted to JSON');
                        resolve();
                    }
                    catch (ex) {
                        reject(ex);
                    }
                });
            });
        });
    }

    function editHTML() {
        return new Promise(function (resolve, reject) {
            APIprojects.forEach(function (project) {
                //check if file exists first
                try {
                    let htmlFilePath = path.join(project.swagger_dir, 'index.html');
                    htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
                    htmlContent = htmlContent.replace('___$JSON_PLACEHOLDER$___', swagger_json_file);
                    fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
                    resolve();
                }
                catch (ex) {
                    console.log('ex...', ex);
                    reject(ex);
                }
            });
        });
    }

    //TODO: edit and copy package.json file
    function updateProjectPackage() {
        return new Promise(function (resolve, reject) {
            APIprojects.forEach(function (project) {
                //check if file exists first
                try {
                    console.log('will create update package.json file..')
                    let packageFilePath = path.join(project.swagger_dir, 'package.json');
                    let packageFileTargetPath = path.join(project.swagger_dir, 'package.json');
                    let packageFileContent = fs.readFileSync(packageFilePath, 'utf8');
                    let packageObj = JSON.parse(packageFileContent);
                    packageObj['dependencies']['swagger-node-express'] = "^2.1.3";
                    packageObj['dependencies']['minimist'] = "^1.2.0";
                    packageObj['dependencies']['body-parser'] = "^1.15.2";
                    fs.writeFileSync(packageFileTargetPath, JSON.stringify(packageObj), 'utf8');
                    console.log('package.json edited');
                    resolve();
                }
                catch (ex) {
                    console.log('ex...', ex);
                    reject(ex);
                }
            });
        });
    }

    //TODO: edit and copy runSwagger file
    function createStartFiles() {
        return new Promise(function (resolve, reject) {
            let portPrefix = '800';
            let portInc = 1;
            let apiPort = 3000;
            APIprojects.forEach(function (project) {
                //check if file exists first
                try {
                    let swagFilePath = 'runSwagger.js';
                    let scriptFileName = 'runSwagger.js';
                    let isWindows = hostOS.includes('WINDOWS');
                    let runSwaggerTargetPath = path.join(project.swagger_dir, scriptFileName);
                    let runManuallyScriptPath = path.join(project.swagger_dir, 'manual_start') + (isWindows ? '.bat' : '.sh');
                    let swagFileContent = fs.readFileSync(path.join(local_project_root, '/client', swagFilePath), 'utf8');
                    swagFileContent = swagFileContent.replace('__$API_TITLE$__', project.project_name + ' API');
                    swagFileContent = swagFileContent.replace('__$API_DESC$__', 'This is the API for ' + project.project_name);
                    apiPort = portPrefix + portInc++;
                    swagFileContent = swagFileContent.replace('__$PORT$__', apiPort);
                    fs.writeFileSync(runSwaggerTargetPath, swagFileContent, 'utf8');

                    let manualStartScriptContent = '';
                    if (isWindows) {
                        //create batch script
                        manualStartScriptContent += 'call npm install\r\n';
                        manualStartScriptContent += 'call node runSwagger\r\n';
                    }
                    else {
                        //create bash script content
                        manualStartScriptContent += 'cd ' + project.swagger_dir + ' && ';
                        manualStartScriptContent += 'npm install && ';
                        manualStartScriptContent += 'node runSwagger.js';
                    }
                    //create .bat or .sh file that starts the app
                    fs.writeFileSync(runManuallyScriptPath, manualStartScriptContent, 'utf8');

                    const spawn = require('child_process').spawn;

                    let cmd = '';

                    cmd = isWindows ? spawn('cmd.exe', ['/c', runManuallyScriptPath], { cwd: project.swagger_dir }) : spawn('bash', [runManuallyScriptPath], { cwd: project.swagger_dir })

                    cmd.stdout.on('data', function (data) {
                        console.log('stdout: ' + data);
                    });

                    cmd.stderr.on('data', function (data) {
                        console.log('stderr: ' + data);
                    });

                    cmd.on('exit', function (code) {
                        console.log('child process exited with code ' + code);
                    });
                    console.log('process started..');
                    console.log('will check for npm module dependencies');
                    project.port = apiPort;
                    resolve(apiPort);
                }
                catch (ex) {
                    console.log('ex...', ex);
                    reject(ex);
                }
            });
        });
    }

    //TODO: edit and copy runSwagger file
    function runinstance() {
        return new Promise(function (resolve, reject) {
            APIprojects.forEach(function (project) {
                //check if file exists first
                try {
                    console.log('will create swagger file..')
                    let swagFilePath = 'runSwagger.js';
                    let swagFileTargetPath = path.join(project.project_swag_dir, 'runSwagger.js');
                    let swagFileContent = fs.readFileSync(swagFilePath, 'utf8');
                    swagFileContent = swagFileContent.replace('__$API_TITLE$__', project.project_name + ' API');
                    console.log('will replace content   .. ', swagFileContent);
                    fs.writeFileSync(swagFileTargetPath, swagFileContent, 'utf8');
                    console.log('runSwagger.js edited');
                    resolve();
                }
                catch (ex) {
                    console.log('ex...', ex);
                    reject(ex);
                }
            });
        });
    }

    (function executeAll() {
        let tasks = [discoverSwagerAPI, createSwaggerDirectories, convertYAMLtoJSON, editHTML, updateProjectPackage, createStartFiles];
        let result = Promise.resolve();
        tasks.forEach(task => {
            result = result.then(() => task());
        })
        return result;
    })();
}