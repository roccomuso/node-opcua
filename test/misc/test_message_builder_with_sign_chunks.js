var should = require("should");
var compare_buffers = require("../../lib/misc/utils").compare_buffers;
var BinaryStream = require("../../lib/misc/binaryStream").BinaryStream;
var util = require("util");
var debugLog = require("../../lib/misc/utils").make_debugLog(__filename);
var hexDump = require("../../lib/misc/utils").hexDump;

var make_lorem_ipsum_buffer = require("../helpers/make_lorem_ipsum_buffer").make_lorem_ipsum_buffer;

var iterate_on_signed_message_chunks = require("../helpers/fake_message_chunk_factory").iterate_on_signed_message_chunks;

var MessageBuilder = require("../../lib/misc/message_builder").MessageBuilder;

describe("MessageBuilder with SIGN support", function () {

    var lorem_ipsum_buffer  = make_lorem_ipsum_buffer();

    it("should not emit an error event if chunks have valid signature", function (done) {

        var options = {};

        var messageBuilder = new MessageBuilder(options);
        messageBuilder._decode_message_body = false;

        messageBuilder
            .on("full_message_body",function(message) {
                done();
            })
            .on("message",function(message){

            })
            .on("error", function (error) {
                done(error);
            });

        iterate_on_signed_message_chunks(lorem_ipsum_buffer,function(err,chunk) {
            messageBuilder.feed(chunk.slice(0, 20));
            messageBuilder.feed(chunk.slice(20));
        });

    });

    it("should reconstruct a full message made of many signed chunks", function (done) {

        var options = {};

        var messageBuilder = new MessageBuilder(options);
        messageBuilder._decode_message_body = false;

        messageBuilder.on("full_message_body",function(message) {

                debugLog(message.toString());
                message.toString().should.eql(lorem_ipsum_buffer.toString());

                done();
            })
            .on("chunk",function(chunk){
                debugLog(hexDump(chunk));
            })
            .on("message",function(message){
                // debugLog(hexDump(message));
            })
            .on("error", function (err) {

                done(new Error(" we are not expecting a error event in this case"+err));
            });

        iterate_on_signed_message_chunks(lorem_ipsum_buffer,function(err,chunk) {
            messageBuilder.feed(chunk.slice(0, 20));
            messageBuilder.feed(chunk.slice(20));
        });


    });
    it("should emit an bad_signature event if chunk has been tempered", function (done) {

        var options = { };

        var messageBuilder = new MessageBuilder(options);
        messageBuilder._decode_message_body = false;

        messageBuilder
            .on("full_message_body",function(message) {
                done(new Error("it should not emmit a message event if a signature is invalid or missing"));
            })
            .on("message",function(message){
                done(new Error("it should not emmit a message event if a signature is invalid or missing"));
            })
            .on("error", function (err) {
                debugLog(err);
                debugLog("this chunk has a altered body ( signature verification failed)".yellow);
                //xx debugLog(hexDump(chunk));
                done();
            });

        iterate_on_signed_message_chunks(lorem_ipsum_buffer,function(err,chunk) {

            // alter artificially the chunk
            // this will damage the chunk signature

            chunk.write("####*** TEMPERED ***#####",0x3a0);


            messageBuilder.feed(chunk.slice(0, 20));
            messageBuilder.feed(chunk.slice(20));
        });

    });

});