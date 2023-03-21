import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

            let container;
            let camera, scene, renderer;
            let controls, water, sun, mesh;
            let model;
            
            init();
            animate();

            function init() {

                container = document.getElementById( 'container' );

                //

                renderer = new THREE.WebGLRenderer();
                renderer.setPixelRatio( window.devicePixelRatio );
                renderer.setSize( window.innerWidth, window.innerHeight );
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                container.appendChild( renderer.domElement );

                //

                scene = new THREE.Scene();
                const loader = new GLTFLoader();

                loader.load('models/John_the_Baptist.gltf', function (gltf) {
                    gltf.scene.scale.set(0.5, 0.5, 0.5);
                    gltf.scene.position.set(0, -1.5, 0);
                    gltf.scene.rotation.y = Math.PI * 4.5;
                    gltf.scene.rotation.x = 0.08;
                    model = gltf.scene;
                    scene.add(model);
                }, undefined, function (error) {
                    console.error(error);
                });
                             


                camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 20000 );
                camera.position.set( 15, 6,-5 );

                //

                sun = new THREE.Vector3();

                // Water

                const waterGeometry = new THREE.PlaneGeometry( 4000, 4000 );

                water = new Water(
                    waterGeometry,
                    {
                        textureWidth: 512,
                        textureHeight: 512,
                        waterNormals: new THREE.TextureLoader().load( 'textures/waternormals.jpg', function ( texture ) {

                            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

                        } ),
                        sunDirection: new THREE.Vector3(),
                        sunColor: 0xffffff,
                        waterColor: 0x001e0f,
                        distortionScale: 3.7,
                        fog: scene.fog !== undefined
                    }
                );

                water.rotation.x = - Math.PI / 2;
                

                scene.add( water );

                // Skybox

                const sky = new Sky();
                sky.scale.setScalar( 10000 );
                scene.add( sky );

                const skyUniforms = sky.material.uniforms;

                skyUniforms[ 'turbidity' ].value = 10;
                skyUniforms[ 'rayleigh' ].value = 2;
                skyUniforms[ 'mieCoefficient' ].value = 0.005;
                skyUniforms[ 'mieDirectionalG' ].value = 0.8;

                const now = new Date();
                const currentTimeRatio = (now.getHours() * 60 + now.getMinutes()) / (24 * 60);
            
                const minAzimuth = -180;
                const maxAzimuth = 180;
                const currentAzimuth = minAzimuth + currentTimeRatio * (maxAzimuth - minAzimuth);
            
                const parameters = {
                    elevation: 2,
                    azimuth: currentAzimuth // Set the azimuth based on real-life time
                };

                const pmremGenerator = new THREE.PMREMGenerator( renderer );
                let renderTarget;

                function updateSun() {

                    const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
                    const theta = THREE.MathUtils.degToRad( parameters.azimuth );

                    sun.setFromSphericalCoords( 1, phi, theta );

                    sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
                    water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

                    if ( renderTarget !== undefined ) renderTarget.dispose();

                    renderTarget = pmremGenerator.fromScene( sky );

                    scene.environment = renderTarget.texture;

                }

                updateSun();

                //

                controls = new OrbitControls( camera, renderer.domElement );
                controls.maxPolarAngle = Math.PI * 0.495;
                controls.target.set( 0, 10, 0 );
                controls.minDistance = 30.0;
                controls.maxDistance = 100.0;
                controls.update();


                // GUI

                const gui = new GUI();

                const folderSky = gui.addFolder( 'Sky' );
                folderSky.add( parameters, 'elevation', 0, 90, 0.1 ).onChange( updateSun );
                folderSky.add( parameters, 'azimuth', - 180, 180, 0.1 ).onChange( updateSun );
                folderSky.open();

                const waterUniforms = water.material.uniforms;

                const folderWater = gui.addFolder( 'Water' );
                folderWater.add( waterUniforms.distortionScale, 'value', 0, 8, 0.1 ).name( 'distortionScale' );
                folderWater.add( waterUniforms.size, 'value', 0.1, 10, 0.1 ).name( 'size' );
                folderWater.open();

                //

                window.addEventListener( 'resize', onWindowResize );

            }

            function onWindowResize() {

                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();

                renderer.setSize( window.innerWidth, window.innerHeight );

            }

            function animate() {
                requestAnimationFrame(animate);
            
                if (model) {
                    const time = performance.now() * 0.002;
                    model.position.y = -1.5 + Math.sin(time) * 0.6;
                    model.position.x = Math.sin(time * 0.3) * 0.2;
                    model.rotation.y = Math.PI * 4.5 + Math.sin(time * 0.5) * 0.1;
                    model.rotation.x = 0.08 + Math.sin(time * 0.7) * 0.05;
                    model.rotation.z = Math.sin(time * 0.4) * 0.1;
                }
            
                render();
            }
            

            function render() {
                

                const time = performance.now() * 0.001;
                water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
                renderer.render( scene, camera );

            }
