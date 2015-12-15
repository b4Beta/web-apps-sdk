module.exports = function(config) {
    var configuration = {
        browsers: ["Chrome", "Firefox"],

        coverageReporter: {
            type: "html",
            dir: "coverage/"
        },

        frameworks: ["jasmine"],

        files: [
            {
                "pattern": "node_modules/handlebars/dist/handlebars.js",
                "included": true,
                "served": true,
                "watched": false
            },
            "lib/webcomponentsjs/webcomponents.min.js",
            {
                pattern: "lib/**",
                included: false,
                served: true,
                watched: false
            },
            "lib/jquery/dist/jquery.js",
            "lib/jquery-cookie/jquery.cookie.js",
            {
                pattern: "src/bcapi.js",
                included: true,
                served: true,
                watched: false
            },
            {
                pattern: "src/helper.js",
                included: true,
                served: true,
                watched: false
            },
            {
                pattern: "src/webcomponents/components.js",
                included: true,
                served: true,
                watched: false
            },
            {
                pattern: "src/webcomponents/components_exceptions.js",
                included: true,
                served: true,
                watched: false
            },
            {
                pattern: "src/webcomponents/datasources/datasource.js",
                included: true,
                served: true,
                watched: false
            },
            {
                pattern: "src/webcomponents/**/*.js",
                included: true,
                served: true,
                watched: true
            },
            {
                pattern: "src/webcomponents/**/*.html",
                included: true,
                served: true,
                watched: false
            },
            {
                pattern: "test/webcomponents/helpers/components_helper.js",
                included: true,
                watched: false
            },
            {
                pattern: "test/webcomponents/helpers/custom_matchers.js",
                included: true,
                watched: false
            },
            {
                pattern: "test/webcomponents/**/*.js",
                watched: false
            },
            {
                pattern: "test/webcomponents/templates/**/*.*",
                watched: false,
                served: true,
                included: false
            }
        ],

        preprocessors: {
            "src/webcomponents/**/*.js": ["coverage"]
        },

        port: 9876,

        proxies: {
            "/lib": "http://localhost:9876/base/lib",
            "/src": "http://localhost:9876/base/src",
            "/test": "http://localhost:9876/base/test"
        },

        reporters: ["progress", "coverage", "threshold"],

        thresholdReporter: {
            statements: 90,
            branches: 85,
            functions: 85,
            lines: 90
        }
    };

    config.set(configuration);
};