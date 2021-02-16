import 'package:flutter/material.dart';

class HomeTransaction extends StatefulWidget {
  @override
  _HomeTransactionState createState() => _HomeTransactionState();
}

class _HomeTransactionState extends State<HomeTransaction> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(height: 30),
          Align(
            alignment: Alignment.center,
            child: RawMaterialButton(
              onPressed: () {
                Navigator.pushNamed(context, '/transaction');
              },
              elevation: 5.0,
              fillColor: Colors.purpleAccent,
              child: Icon(
                Icons.arrow_upward,
                size: 70.0,
              ),
              padding: EdgeInsets.all(20.0),
              shape: CircleBorder(),
            ),
          ),
          SizedBox(height: 10),
          Align(
            alignment: Alignment.center,
            child: Text(
              "Send coins",
              style: TextStyle(
                color: Colors.white,
                fontSize: 20.0
              ),
            ),
          ),
          SizedBox(height: 70),
          Align(
            alignment: Alignment.center,
            child: RawMaterialButton(
              onPressed: () {

              },
              elevation: 5.0,
              fillColor: Colors.greenAccent,
              child: Icon(
                Icons.arrow_downward,
                size: 70.0,
              ),
              padding: EdgeInsets.all(20.0),
              shape: CircleBorder(),
            ),
          ),
          Align(
            alignment: Alignment.center,
            child: Text(
              "Recieve coins",
              style: TextStyle(
                color: Colors.white,
                fontSize: 20.0,
              ),
            ),
          )
        ],
      )
    );
  }
}
