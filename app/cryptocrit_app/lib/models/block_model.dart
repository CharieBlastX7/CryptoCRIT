import './transaction_model.dart';

class Block {
  final int index;
  final int difficulty;
  final nonce;
  final String hash;
  final String prevHash;
  final int timestamp;
  Transaction data;

  Block({
    this.index,
    this.difficulty,
    this.nonce,
    this.hash,
    this.prevHash,
    this.timestamp,
  });

  factory Block.fromJson(Map<String, dynamic> json) {
    return Block(
        index: json['index'],
        difficulty: json['difficulty'],
        nonce: json['nonce'],
        hash: json['hash'],
        prevHash: json['prevHash'],
        timestamp: json['timestamp']
        //data: json['data']
        );
  }
}
